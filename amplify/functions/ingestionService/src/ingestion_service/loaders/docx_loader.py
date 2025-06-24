#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
#  SPDX-License-Identifier: MIT-0

import pypandoc as pypd
import shutil
import zipfile
from datetime import datetime

import ingestion_service.utils as utils
from ingestion_service.loaders.loader import Loader
from ingestion_service.loaders.text_loader import TextLoader
from ingestion_service.loaders.xlsx_loader import XlsxLoader


class DocxLoader(Loader):
    def __init__(self):
        self.utils = utils

    def check_for_embedded_docs(self, path):
        zipfile_path = path.replace('.docx', '.zip')
        shutil.copy(path, zipfile_path)
        embedded_doc_paths = []
        with zipfile.ZipFile(zipfile_path, 'r') as zip_ref:
            for name in zip_ref.namelist():
                if name.startswith('word/embeddings'):
                    zip_ref.extract(name)
                    new_name = path.replace('.docx', '_') + name.split('/')[-1]
                    shutil.move(name, new_name)
                    embedded_doc_paths.append(new_name)
        return embedded_doc_paths

    def load(self, path):
        if not path.endswith('.docx'):
            msg = f'File {path} is not a docx.'
            if path.endswith('.doc'):
                msg += " Older .doc files are not supported."
            raise Exception(msg)
        text = pypd.convert_file(path, 'markdown', extra_args=['--quiet'])
        # print(f"pypandoc extracted text from word doc: {text}")
        embedded_doc_paths = self.check_for_embedded_docs(path)
        print(f"Got embedded doc paths {embedded_doc_paths}")
        if len(embedded_doc_paths) == 0:
            text += "\n\n<attachments>\n"
            for embedded_doc_path in embedded_doc_paths:
                text += "\n<attachment>\n"
                text += f"<filename>{embedded_doc_path}</filename>\n<content>"
                
                if embedded_doc_path.endswith('.xlsx'):
                    docs = XlsxLoader().load(embedded_doc_path, one_doc_per_line=False)
                elif doc.endswith('.docx'):
                    docs = DocxLoader().load(embedded_doc_path)
                else:
                    # default to the text loader
                    docs = TextLoader().load(embedded_doc_path)

                docs_txt = ''
                for doc in docs:
                    docs_txt += doc.content + "\n"
                text +=  docs_txt
                text += "</content>\n</attachment>\n"
            text+= "\n</attachments>"
        print(f"DocxLoader returning text {text}")
        return text