#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
#  SPDX-License-Identifier: MIT-0

import json
import os

from datetime import datetime
from copy import deepcopy
from hashlib import md5 

from ingestion_service.loaders.loader import Loader
from ingestion_service.utils import utils


default_json_content_fields = [
    "page_content", "content", "text"
]
default_json_id_fields = [
    'source', 'id','url', 'filename'
]
default_json_title_fields = [
    'title', 'url', 'source', 'filename', 'id',
]


class JsonLoader(Loader):
    def __init__(self, *, 
        json_content_fields_order: [str] = default_json_content_fields,
        json_id_fields_order: [str] = default_json_id_fields,
        json_title_fields_order: [str] = default_json_title_fields,
    ):
        super().__init__()

        self.utils = utils

        self.json_content_fields_order = json_content_fields_order
        self.json_id_fields_order = json_id_fields_order
        self.json_title_fields_order = json_title_fields_order

    def create_ingestion_id(self, json_record, filename, job_id):
        print(f"create_ingestion_id got {json_record}, {filename}, {job_id}")
        if isinstance(json_record, str):
            json_record = json.loads(json_record)
        for id_field in self.json_id_fields_order:
            if id_field in list(json_record.keys()):
                return f"{job_id}/{json_record[id_field]}"
        
    def create_content(self, json_record):
        if isinstance(json_record, str):
            json_record = json.loads(json_record)
        for content_field in self.json_content_fields_order:
            if content_field in list(json_record.keys()):
                return json_record[content_field]
        
    def create_title(self, json_record):
        if isinstance(json_record, str):
            json_record = json.loads(json_record)
        for title_field in self.json_title_fields_order:
            if title_field in list(json_record.keys()):
                return json_record[title_field]

    def extract_line(self, jsonline, source, user_id):
        if not jsonline or len(jsonline) == 0:
            return None
        content = None
        doc_id = None
        title = None
        json_obj = json.loads(jsonline)
        print(f"Got line to extract: {json_obj}")
        meta = deepcopy(json_obj)
        keys = list(json_obj.keys())
        print(f"extract_line gotot source {source}")
        job_id = source.split('/')[-2]
        filename = source.split('/')[-1]
        doc_id = self.create_ingestion_id(json_obj, filename, job_id)
        print(f"Created ingestion id {doc_id}")
        title = self.create_title(json_obj)
        print(f"Created title {title}")
        content = self.create_content(json_obj)
        print(f"Created content {content}")

        if not title:
            title = doc_id
        if not 'title' in meta:
            meta['title'] = title
        if not 'source' in meta:
            meta['source'] = source
        
        etag = md5(jsonline.encode('utf-8')).hexdigest()
        meta['etag'] = etag
        lines_processed = 1
        status = 'IN_PROGRESS'
        print(f"Saving ingestion status with path {doc_id}")
        ing_status = self.utils.set_ingestion_status(
            user_id,
            doc_id,
            etag,
            lines_processed,
            status,
            self.my_origin
        )

        if not (content and doc_id and title):
            raise Exception(f"Couldn't find at least one of content ({content}), doc_id ({doc_id}), and title ({title})")
        else:
            print(f"Found doc_id {doc_id}, title {title}, content\n{content}\n\n")
        return {
            'id': doc_id,
            'content': content,
            'metadata': meta
        }
                    
    def load(self, path, user_id, json_lines=False, source=None):
        if not path: 
            return None
        if not source:
            source = path
        print(f"Loading path {path}, json_lines={json_lines}, source={source}, user_id {user_id}")
        filename = path.split('/')[-1]
        with open(path, 'r') as f:
            if not json_lines:
                return self.extract_line(f.read().replace("\n", "").strip(), source, user_id)
                
            else:
                line_ctr = 1
                # jsonlines format
                line = f.readline()
                while line:
                    yield self.extract_line(line.strip(), source, user_id)
                    # if new_doc:
                    #   new_doc.id = f"{filename}:{new_doc.id}:L{line_ctr}"
                    # print(f"Loaded doc {new_doc.to_json()}")
                    # docs.append(new_doc)
                    # line_ctr += 1
                    line = f.readline()
                

    