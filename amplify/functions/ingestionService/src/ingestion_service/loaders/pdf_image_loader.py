#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
#  SPDX-License-Identifier: MIT-0

import boto3
import json
import os
import shutil
import time

from base64 import b64encode
from datetime import datetime
from pdf2image import convert_from_path

from ingestion_service.utils import utils 
from ingestion_service.loaders.loader import Loader
from ingestion_service.bedrock_provider import BedrockProvider

default_ocr_template_path = 'loaders/pdf_image_loader_ocr_template.txt'
default_ocr_model = os.getenv('OCR_MODEL_ID')
default_embedding_model = os.getenv('EMBEDDING_MODEL_ID')


class PdfImageLoader(Loader):
    def __init__(self,*, 
        ocr_model_id: str = None,
        ocr_template_text: str = None,
        s3: boto3.client = None,
        **kwargs
    ): 
        # print(f"remaining kwargs: {kwargs}")
        super().__init__(**kwargs)

        self.utils = utils
        self.bedrock = BedrockProvider()

        if not ocr_model_id:
            self.ocr_model_id = default_ocr_model
        else:
            self.ocr_model_id = ocr_model_id

        if not s3:
            self. s3 = self.utils.BotoClientProvider.get_client('s3')
        else:
            self.s3 = s3

        if not ocr_template_text:
            ocr_template_path = self.get_default_ocr_template_path()
            # print(f"Fetching default ocr_template from {ocr_template_path}")
            with open(ocr_template_path, 'r') as f_in:
                self.ocr_template_text = f_in.read()
        else:
            # print("Using ocr template data passed in.")
            self.ocr_template_text = ocr_template_text
        # print(f"PdfImageLoader initialized with ocr template text {self.ocr_template_text}")

    def get_default_ocr_template_path(self):
        return default_ocr_template_path

    def llm_ocr(self, img_paths, parent_filename, extra_header_text, extra_metadata):
        if not hasattr(self, 'ocr_template_text') or not self.ocr_template_text:
            ocr_template_path = self.get_default_ocr_template_path()
            # print(f"Fetching default ocr_template from {ocr_template_path}")
            with open(ocr_template_path, 'r') as f_in:
                self.ocr_template_text = f_in.read()
        results = []
        chunk_num = 0
        page_num = 1
        curr_chunk_text = ''
        curr_chunk_tokens = 0

        file_name_header = f'<FILENAME>\n{parent_filename.split("/")[-1]}\n</FILENAME>\n'
        # file_name_header_tokens = self.estimate_tokens(file_name_header)
        print(f"** Received {len(img_paths)} pages to process **")
        markdown = ''
        for path in img_paths:
            # print(f"Processing file {path}")
            page_id = f"{parent_filename}:{page_num}"

            with open(path, 'rb') as img:
                content = b64encode(img.read()).decode('utf-8')  # .encode('utf-8')
                print(f"Type of content is now {type(content)}")
                
            msgs = [
                {
                    "role": "user",
                    "content": [
                        {
                            "image": {
                                "source": {
                                    "bytes": content,
                                },
                                "format": "jpeg"
                            }
                        },
                        {
                            "text": f"{file_name_header}\n{page_header}\n{self.ocr_template_text}"
                        }
                    ]
                }
            ]
            print(f"Invoking model with msgs {msgs}")
            markdown += self.bedrock.invoke_model(
                messages=messages,
                model_id=self.ocr_model_id
            )
        return markdown

    def load(self, path):
        print(f"Loading path {path}")
        if path.startswith('s3://'):
            parts = path.split('/')
            bucket = parts[2]
            s3_path = '/'.join(parts[3:])
            local_file = self.utils.download_from_s3(bucket, s3_path)
        else:
            local_file = path
        print(f"Loaded pdf to {local_file}")
        return local_file

    def load_and_split(self, path, user_id, source=None, *, etag='', extra_metadata={}, extra_header_text=''):
        if not source:
            source = path
        print(f"PdfImageLoader loading {path}, {source}", flush=True)
        job_id = source.split('/')[-2]
        filename = source.split('/')[-1]

        # result = self.utils.set_ingestion_status(
        #     user_id, 
        #     f"{job_id}/{filename}",
        #     etag,
        #     0, 
        #     'IN_PROGRESS',
        #     self.utils.get_ssm_params('origin_ingestion_provider')
        # )
        # print(f"Result from setting ingestion status to IN_PROGRESS: {result}")
        try:
            print(f"Loading path {path}")
            print(f"does path exist? {os.path.exists(path)}", flush=True)
            local_file = self.load(path)
            print(f"Got local file {local_file} loaded...now splitting.", flush=True)
            split_results = self.split_pages(local_file)
            print(f"Got split results {split_results}", flush=True)
            docs: [VectorStoreDocument] = self.llm_ocr(split_results['splits'], source, extra_header_text, extra_metadata)
            print(f"Returning {len(docs)} docs: {docs}", flush=True)
            return docs
        except Exception as e:
            print(dir(e))
            print(f"Error loading {path}: {e}")
            os.unlink(path)
            self.utils.set_ingestion_status(
                user_id, 
                f"{job_id}/{filename}",
                etag,
                0, 
                f'ERROR: {e.__dict__}',
                self.utils.get_ssm_params('origin_ingestion_provider')
            )
            
            raise e

    @staticmethod
    def split_pages(local_file):
        # print(f"splitting local file {local_file}")
        tmp_dir = '/'.join(local_file.split('/')[0:3]) 
        local_imgs_path = tmp_dir + '/img_splits'
        os.makedirs(local_imgs_path, exist_ok=True)
        # print(f"Saving images to {local_imgs_path}")
        convert_from_path(local_file, fmt="jpeg", output_folder=local_imgs_path)
        paths = []
        files = os.listdir(local_imgs_path)
        # print(f"Got {len(files)} pages extracted from pdf.")
        for path in files:
            paths.append(f"{local_imgs_path}/{path}")
        paths.sort()
        # print(f"{len(paths)} pages to process")

        return {
            "data_type": "image_path",
            "splits": paths
        }

        

            
            
        



