#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
#  SPDX-License-Identifier: MIT-0

import boto3
import json
import os
import requests
from aws_requests_auth.aws_auth import AWSRequestsAuth
from math import ceil

from .boto_client_provider import BotoClientProvider
from ingestion_service.bedrock_provider import BedrockProvider


sanitize_attributes = ['user_id']

bedrock_agent_client_singleton = None
bedrock_agent_runtime_client_singleton = None
bedrock_client_singleton = None
bedrock_runtime_client_singleton = None
bedrock_provider_singleton = None
lambda_client_singleton = None
s3_client_singleton = None
sqs_client_singleton = None
ssm_client_singleton = None
ssm_params = None
stack_name = os.getenv('STACK_NAME')

# def delete_sqs_message(rcpt_handle:str, queue_url: str, *, sqs_client=None): 
#     if not sqs_client:
#         if not sqs_client_singleton:
#             sqs_client_singleton = BotoClientProvider.get_client('sqs')
    
#     sqs_client = sqs_client_singleton
    
#     try: 
#         sqs_client.delete_message(QueueUrl=queue_url, ReceiptHandle=rcpt_handle)
#     except Exception as e:
#         # print(f"e.args[0] == {e.args[0]}")
#         if "NonExistentQueue" in e.args[0]:
#             # print("CAUGHT ERROR due to non-existent queue in dev")
#         elif "ReceiptHandleIsInvalid" in e.args[0]:
#             # print("CAUGHT ERROR due to non-existent receipt handle in dev.")            
#         else:
#             raise Exception(f'Error occurred while deleting message: {e.args[0]}')

def upsert_doc_collection(collection, origin, *, account_id=None, lambda_client=None):
    if not account_id:
        account_id = os.getenv('AWS_ACCOUNT_ID')
    print(f"upsert_doc_collection got collection {collection}")
    doc_collections_fn_name = get_ssm_params('document_collections_handler_function_name')
    response = invoke_lambda(
        doc_collections_fn_name,
        {
            "requestContext": {
                "accountId": account_id,
            }, 
            "headers": {
                "origin": origin
            },
            "routeKey": "POST /document_collections",
            "body": {
                "document_collection": collection,
                "user_id": collection['user_id']
            }
        },
        lambda_client=lambda_client
    )
    print(f"responses = {response}")
    return response


def delete_ingestion_status(user_id, doc_id, origin, *, delete_from_s3=False):
    return invoke_lambda(
        get_ssm_params('ingestion_status_provider_function_name'),
        {
            "operation": "delete_ingestion_status",
            "origin": origin,
            "args": {
                "user_id": user_id,
                "doc_id": doc_id,
                "delete_from_s3": delete_from_s3
            }
        }
    )

def download_from_s3(bucket, s3_path):
    ts = datetime.now().isoformat()
    tmpdir = f"/tmp/{ts}"
    # print(f"Creating tmpdir {tmpdir}")
    os.makedirs(tmpdir)
    filename = s3_path.split('/')[-1].replace(' ', '_')
    local_file_path = f"{tmpdir}/{filename}"
    # print(f"Downloading s3://{bucket}/{s3_path} to local_file_path {local_file_path}")
    self.s3.download_file(bucket, s3_path, local_file_path)
    # print(f"Success? {os.path.exists(local_file_path)}")
    return local_file_path

def embed_text_bedrock(text, model_id, *, dimensions=1024, lambda_client=None):
    global bedrock_provider_singleton
    if not bedrock_provider_singleton:
        bedrock_provider_singleton = BedrockProvider()
    return bedrock_provider_singleton.embed_text(text, model_id, dimensions=dimensions)


def format_response(status, body, origin, *, dont_sanitize_fields=[]):
    # print(f"format_response got status {status}, body {body}, origin {origin}")
    body = sanitize_response(body, dont_sanitize_fields=dont_sanitize_fields)
    response = {
        'statusCode': str(status),
        'headers': {
            'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-csrf-token, X-Api-Key, *',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'DELETE,OPTIONS,GET,POST,PUT',
            'Vary': 'Origin'
        },
        'body': json.dumps(body)
    }
    # print(f"Returning response {response}")
    return response 


def get_bedrock_agent_client():
    global bedrock_agent_client_singleton
    if not bedrock_agent_client_singleton:
        bedrock_agent_client_singleton = BotoClientProvider.get_client('bedrock-agent')
    return bedrock_agent_client_singleton


def get_bedrock_agent_runtime_client():
    global bedrock_agent_runtime_client_singleton
    if not bedrock_agent_runtime_client_singleton:
        bedrock_agent_runtime_client_singleton = BotoClientProvider.get_client('bedrock-agent-runtime')
    return bedrock_agent_runtime_client_singleton


def get_bedrock_client():
    global bedrock_client_singleton
    if not bedrock_client_singleton:
        bedrock_client_singleton = BotoClientProvider.get_client('bedrock')
    return bedrock_client_singleton

def get_bedrock_runtime_client():
    global bedrock_runtime_client_singleton
    if not bedrock_runtime_client_singleton:
        bedrock_runtime_client_singleton = BotoClientProvider.get_client('bedrock-runtime')
    return bedrock_runtime_client_singleton


def get_model_dimensions(origin, model_id=None):
    global bedrock_provider_singleton
    if not bedrock_provider_singleton:
        bedrock_provider_singleton = BedrockProvider()
    return bedrock_provider_singleton.get_model_dimensions(model_id)


def  get_model_max_tokens(origin, model_id):
    global bedrock_provider_singleton
    if not bedrock_provider_singleton:
        bedrock_provider_singleton = BedrockProvider()
    return bedrock_provider_singleton.get_model_max_tokens(model_id)


def get_s3_client():
    global s3_client_singleton
    if not s3_client_singleton:
        s3_client_singleton = BotoClientProvider.get_client('s3')
    return s3_client_singleton


def get_token_count(text):
    return ceil(len(text.split())* 1.3)


def invoke_bedrock(operation, kwargs):
    global bedrock_provider_singleton
    if not bedrock_provider_singleton:
        bedrock_provider_singleton = BedrockProvider()
    return bedrock_provider_singleton.invoke_bedrock(operation, kwargs)   


def sanitize_response(body, *, dont_sanitize_fields=[]):
    # # print(f"Sanitize_response received body {body}")
    if isinstance(body, dict):
        keys = list(body.keys())
        for key in keys:
            if key in sanitize_attributes and \
                key not in dont_sanitize_fields:
                # # print(f"\nDeleting {key}\n")
                del body[key]
            else:
                if isinstance(body[key], dict):
                    result = sanitize_response(body[key])
                    body[key] = result
    # # print(f"sanitize_response returning {body}")
    return body


# def save_vector_docs(docs, collection_id, origin):
#     converted_docs = []
#     for doc in docs:
#         converted_docs.append(doc.to_dict())
#     print(f"utils.save_vector_docs called with {converted_docs}, {collection_id}, {origin}")
#     evt = {
#         "operation": "save",
#         "origin": origin,
#         "args": {
#             "collection_id": collection_id,
#             "documents": converted_docs
#         }
#     }
#     print(f"utils.save_vector_docs sending event {evt}")
#     response = invoke_lambda(
#         get_ssm_params('vector_store_provider_function_name'),
#         evt
#     )
#     print(f"save_vector_docs got response {response}")
#     return len(converted_docs)


# def search_vector_docs(search_recommendations, top_k, origin):
#     print(f"utils.search_vector_docs called with {search_recommendations}, {top_k}, {origin}")
#     evt = {
#         "operation": "semantic_query",
#         "origin": origin,
#         "args": {
#             "search_recommendations": search_recommendations,
#             "top_k": top_k
#         }
#     }
#     print(f"utils.search_vector_docs sending event {evt}")
#     response = invoke_lambda(
#         get_ssm_params('vector_store_provider_function_name'),
#         evt
#     )
#     print(f"search_vector_docs got response {response}")
#     return response


# def set_ingestion_status(user_id, doc_id, etag, lines_processed, progress_status, origin):
#     response = invoke_lambda(
#         get_ssm_params('ingestion_status_provider_function_name'),
#         {
#             "operation": "create_ingestion_status",
#             "origin": origin,
#             "args": {
#                 "user_id": user_id,
#                 "doc_id": doc_id,
#                 "etag": etag,
#                 "lines_processed": lines_processed,
#                 "progress_status": progress_status,
#                 "origin": "system"
#             }
#         }
#     )


def vector_store_query(collection_id, query, origin, *, lambda_client=None):
    response = invoke_lambda(
        get_ssm_params('vector_store_provider_function_name'),
        {
            "operation": "query",
            "origin": origin,
            "args": {
                "collection_id": collection_id,
                "query": query
            }
        },
        lambda_client=lambda_client
    )
    print(f"vector_store_query got response {response}")
    return response