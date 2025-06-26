#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
#  SPDX-License-Identifier: MIT-0

import boto3
import json
import os
from datetime import datetime
from importlib import import_module
from math import floor
from urllib.parse import unquote_plus
from pydantic import BaseModel
from typing import List, Any, Dict

# from ingestion_service.loaders.docx_loader import DocxLoader
from ingestion_service.loaders.json_loader import JsonLoader
# from ingestion_service.loaders.pdf_image_loader import PdfImageLoader
from ingestion_service.loaders.text_loader import TextLoader
from ingestion_service.utils import utils


default_json_content_fields = [
    "page_content", "content", "text", "article"
]
default_json_id_fields = [
    'id','url', 'source'
]
default_json_title_fields = [
    'title', 'url', 'source'
]

default_ocr_model = os.getenv('OCR_MODEL_ID')
# default_embedding_model = os.getenv('EMBEDDING_MODEL_ID')

max_download_attempts = 3
ingestion_service = None

# class S3Bucket(BaseModel):
#     name: str
#     arn: str
#     ownerIdentity: Dict[str, str]

# class S3Object(BaseModel):
#     key: str
#     size: int
#     eTag: str
#     versionId: str
#     sequencer: str

# class S3Event(BaseModel):
#     s3SchemaVersion: str
#     configurationId: str
#     bucket: S3Bucket
#     object: S3Object


# class IngestionServiceEvent(BaseModel):
#     Records: List(S3Event)
    

class IngestionService:
    def __init__(self,*,
        ocr_model_id: str=None,
        s3_client: boto3.client=None,
        json_content_fields_order: [str] = default_json_content_fields,
        json_id_fields_order: [str] = default_json_id_fields,
        json_title_fields_order: [str] = default_json_title_fields
    ):
        self.utils = utils
        self.json_content_fields_order = json_content_fields_order
        self.json_id_fields_order = default_json_id_fields
        self.json_title_fields_order = default_json_title_fields

        self.json_loader = JsonLoader(
            json_content_fields_order=json_content_fields_order,
            json_id_fields_order=json_id_fields_order,
            json_title_fields_order=json_title_fields_order
        )
        
        self.pdf_loader = self.get_pdf_loader()
        if ocr_model_id:
            self.ocr_model_id = ocr_model_id
        else:
            self.ocr_model_id = default_ocr_model

        if not s3_client:
            self.s3 = self.utils.BotoClientProvider.get_client('s3')
        else:
            self.s3 = s3_client
        
    def download_s3_file(self, bucket, s3_key, attempts=0):
        if attempts >= max_download_attempts:
            raise Exception(f"Failed to download {s3_key} after {max_download_attempts} attempts.")
        try:
            parts = s3_key.split('/')
            job_id = parts[-2]
            filename = parts[-1]
            local_path = self.get_tmp_path(job_id, filename)
            self.s3.download_file(bucket, s3_key, local_path)
            return local_path
        except:
            s3_prefix = '/'.join(s3_key.split('/')[:-1])
            s3_key = f"{s3_prefix}/{unquote_plus(filename)}"
            return self.download_s3_file(bucket, s3_key, attempts + 1)

    def find_json_title_field(self, json_dict):
        for field in self.json_title_fields_order:
            if field in json_dict:
                return field
        return ''

    def get_pdf_loader(self):
        # return PdfImageLoader()
        pass

    @staticmethod
    def get_tmp_path(job_id, file_name):
        if '/' in file_name:
            file_name = file_name.split('/')[-1]
        dir_name = f"/tmp/{job_id}"
        if not os.path.isdir(dir_name):
            os.makedirs(dir_name)
        final_val = f'{dir_name}/{file_name}'
        return final_val

    def handle_object_created(self, file_dict):
        print(f"Handling object creation for {file_dict}")
        user_id = file_dict['user_id']
        job_id = file_dict['job_id']
        filename = file_dict['filename']

        s3_prefix = f"private/{user_id}/{job_id}"
        s3_key = f"{s3_prefix}/{filename}"
        print(f"Ingesting {s3_key}")

        local_path = self.download_s3_file(file_dict['bucket'], s3_key)

        result = self.ingest_file(local_path, file_dict)
        print(f"Got result {result}")
        return result
               
    def handler(self, event, context={}):
        print(f"IngestionService received event {event}")
        for record in event['Records']:
            print(f"Got record {record}")
            if 'body' in record:
                body = json.loads(record['body'])
                print(f"Got body {body}")
                event = ''
                if "Event" in body:
                    event = body["Event"]
                if event and event == 's3:TestEvent':
                    return {
                        "statusCode": 200,
                        "body": json.dumps({
                            "message": "Test event received"
                        })
                    }
                if "Records" in body:
                    for rec in body["Records"]:
                        s3_key = rec['s3']['object']['key']
                        user_id = s3_key.split('/')[1]
                        bucket = rec['s3']['bucket']['name']
                        job_id = s3_key.split('/')[2]
                        event_name = ['event_name']
                        filename = unquote_plus(s3_key.split('/')[-1])
                        if 'event' in rec and \
                        rec["event"]== 's3:TestEvent':
                            # return 200 to delete this test message
                            # return {
                            #     "statusCode": 200
                            # }
                            continue

                        if filename is None:
                            # if the key ends in a / it will come back None.
                            # this happens when someone creates a folder in the
                            # console.
                            # print(f"Skipping rec because it's apparently a directory: {rec}")
                            continue
                
                        if 'ObjectCreated' in event_name:
                            result = self.handle_object_created(file)

                        # elif 'ObjectRemoved' in event_name:
                        #     # print(f"Removing file {filename}")
                        #     try:
                        #         result = self.utils.invoke_lambda(
                        #             self.vector_store_provider_fn_name, 
                        #             {
                        #                 'operation': 'delete_record', 
                        #                 'origin': self.utils.get_ssm_params('ingestion_provider_function_name'),
                        #                 'args': {
                        #                     'filename': filename
                        #                 }

                        #             }
                        #         )
                        #         # print(f"Result from deleting record from vector store: {result}")
                        #         result2 = self.utils.invoke_lambda(
                        #             self.ingestion_status_provider_fn_name, 
                        #             {
                        #                 'operation': 'delete_ingestion_status', 
                        #                 'origin': self.utils.get_ssm_params('ingestion_provider_function_name'),
                        #                 'args': {
                        #                     'user_id': user_id, 
                        #                     'filename': filename
                        #                 }
                        #             }
                        #         )
                        #         # print(f"Result from deleting ingestion_status: {result2}")
                        #         # self.vector_store_provider.delete_record(job_id, filename)
                        #         # self.ingestion_status_provider.delete_ingestion_status(user_id, filename)
                        #     except Exception as e:
                        #         # print(f"Error occurred while deleting file: {e}")
                        #         raise e
                    
                        # self.delete_message(rcpt_handle, queue_url)
                    
        return {
            "statusCode": 200,
            "body": "SUCCESS"
        }

    # ingest_file will pass the call to a loader for that type of file.
    # The loader will yield documents until it's complete. For a multi-document
    # format like jsonlines, that means you'll get one doc back out per
    # line in the file, as a VectorDocument object. 
    def ingest_file(self, local_path, file_dict, extra_meta={}): #  source, user_id, extra_meta={}) -> [VectorStoreDocument]:
        # docs = []
        try:
            # job_id = file_dict['job_id']  # source.split('/')[0]
            if local_path.lower().endswith('.jsonl'):
                docs = self.ingest_json_file(local_path, file_dict, json_lines=True)
            elif local_path.lower().endswith('.json'): 
                docs = self.ingest_json_file(local_path, file_dict, json_lines=False)
            elif local_path.lower().endswith('.pdf'):
                docs = self.ingest_pdf_file(local_path, file_dict)
            elif local_path.lower().endswith('.docx'):
                docs = self.ingest_docx_file(local_path, file_dict)
            else:
                # local_path.endswith('.txt'):
                # assume you can parse it as text for now
                docs = self.ingest_text_file(local_path, file_dict)
            # else:
            #     raise Exception(f'unsupported file type: {local_path}\nMore file types coming soon.')
            print(f"ingestion_service.ingest_file saving docs {docs}")
            # self.utils.save_vector_docs(docs, file_dict['job_id'], self.my_origin)
            # self.utils.set_ingestion_status(
            #     file_dict['user_id'],
            #     f"{file_dict['job_id']}/{file_dict['filename']}",
            #     file_dict['etag'],
            #     0,
            #     'INGESTED',
            #     self.my_origin
            # )
            print(f"ingested docs {docs}")
            return docs
        except Exception as e:
            print(f"Error occurred while ingesting file: {e}")
            self.utils.set_ingestion_status(
                file_dict['user_id'],
                f"{file_dict['job_id']}/{file_dict['filename']}",
                file_dict['etag'],
                0,
                f"ERROR: {e.__dict__}",
                self.my_origin
            )
            raise e

    def ingest_docx_file(self, local_path, file_dict):
        # loader = DocxLoader()
        # docs = loader.load(local_path, file_dict['user_id'])
        # return docs
        pass

    def ingest_json_file(self, local_path, file_dict, *, json_lines=True, extra_meta={}):
        # print(f"ingest_json_file got local path {local_path}")
        loader = JsonLoader(
            # JsonLoader provides the defaults below but you can override here.
            # json_content_fields_order = ["page_content", "content", "text", "article"],
            # json_id_fields_order = ['id','url', 'source'],
            # json_title_fields_order = ['title', 'url', 'source', 'id']
        )
        if not 'etag' in extra_meta:
            extra_meta['etag'] = file_dict['etag']
            
        return loader.load(local_path, file_dict['user_id'], f"{file_dict['job_id']}/{file_dict['filename']}", extra_metadata=extra_meta, json_lines=json_lines)
        # docs = loader.load_and_split(local_path, user_id, source, extra_metadata=extra_meta, json_lines=json_lines)
        # return docs

    def ingest_pdf_file(self, local_path, file_dict, *, extra_meta={}, ocr_model_id=None):
        # print(f"Ingesting pdf file {local_path}")
        if not ocr_model_id:
            ocr_model_id = self.ocr_model_id

        docs = self.pdf_loader.load(local_path, file_dict['user_id'], f"{file_dict['job_id']}/{file_dict['filename']}", etag=file_dict['etag'], extra_metadata=extra_meta)
        print(f"ingest_pdf_file returning {docs}")
        return docs

    def ingest_text_file(self, local_path, file_dict, extra_meta={}):
        # print(f"Ingesting text file {local_path}")
        loader = TextLoader()
        docs = loader.load_and_split(local_path, f"{file_dict['job_id']}/{file_dict['filename']}", extra_metadata=extra_meta)
        # print(f"Ingest_text_file returning docs {docs}")
        return docs

    # If you're using scrapy it might spit out content in an array instead of a 
    # single text string, which the JSONLoader doesn't like. flatten any arrays in the
    # incoming object by concatenating the text.
    @staticmethod
    def maybe_fix_jsonl_format(local_path):
        lines_out = ''
        with open(local_path, 'r') as f_in:
            line = json.loads(f_in.readline().strip())
            while line:
                for key in line:
                    if type(line[key]) == list:
                        val = ''
                        for item in line[key]:
                            if val != '':
                                val += ' '
                            val += item
                        line[key] = val
                lines_out += json.dumps(line) + "\n"
                line = f_in.readline().strip()
                if line:
                    line = json.loads(line)
        with open(local_path, 'w') as f_out:
            f_out.write(lines_out)
        return local_path

    # %25 shows up when a percent sign got url quoted
    # which implies that something might have gotten
    # double-quoted if you see %25 in the s3_key.
    def maybe_unquote_s3_key(self, s3_key):
        # %25 is when a percent sign got quoted, which implies that
        # something might have gotten double-quoted.
        if '%25' in s3_key:
            new_key = unquote_plus(s3_key)
            if '%25' in new_key:
                return self.maybe_unquote_s3_uri(new_key)
            else:
                 return new_key
        else:
            return s3_key

    # def set_ingestion_status_batch(self, docs_batch, status, file_dict):
    #         ing_status = IngestionStatus(
    #             file_dict['user_id'],
    #             file_dict['etag'],
    #             file_dict['lines_processed'],
    #             status
    #         )
    #         self.utils.set_ingestion_status(**ing_status, origin=self.my_origin)

    # def save_docs(self, out_queue, job_id, user_id): 
    #     docs_batch = []
    #     doc = out_queue.get()
    #     while doc:
    #         docs_batch.append(doc)
    #         if len(docs_batch) >= self.os_batch_size:
    #             # print(f"saving {len(docs_batch)} docs to the vector index", flush=True)
    #             self.vector_store_provider.save(docs_batch, job_id)
    #             self.set_ingestion_status_batch(
    #                 docs_batch,
    #                 'INGESTED'
    #             )
    #             docs_batch = []
    #         doc = out_queue.get()
        
    #     if len(docs_batch) > 0:
    #         # print(f"saving {len(docs_batch)} docs to the vector index", flush=True)
    #         self.vector_store_provider.save(docs_batch,  job_id)
    #         self.set_ingestion_status_batch(docs_batch, 'INGESTED')
    #     out_queue.put(None)

    def verify_collection(self, collection_dict, *, lambda_client=None): 
        print(f"Verifying collection for file dict {collection_dict}")
        user_id = collection_dict['user_id']
        job_id = collection_dict['job_id']
        # collection_name = collection_dict['collection_name']
        print(f"Getting doc collection {job_id} for user_id {user_id}")
        response = self.utils.get_document_collections(
            user_id,
            job_id, 
            lambda_client=lambda_client,
            origin=self.my_origin
        )

        print(f"Got verified collection: {response}, type {type(response)}")
        collection_name = list(response.keys())[0]
        verified_collection = response[collection_name]
        print(f"Verfiied collection result {verified_collection}")

        if not verified_collection or \
            verified_collection['job_id'] != job_id:
            # print(f"Error: Invalid document collection {job_id} received for user {user_id}")
            return False
        else:
            return verified_collection
                

def handler(event, context):
    global ingestion_service
    if not ingestion_service:
        ingestion_service = IngestionService()
        # print(f"Got ingestion_service {ingestion_service}")
    return ingestion_service.handler(event, context)
