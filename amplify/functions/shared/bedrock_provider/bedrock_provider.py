#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
#  SPDX-License-Identifier: MIT-0

import jq
import json
import os
import sys

from base64 import b64decode, b64encode
from math import ceil
from os import getcwd, getenv, path
from pathlib import Path
from pydantic import BaseModel
from typing import Any

import ingestion_service.utils  

"""
API
event {
    "operation": [embed_text, get_model_dimensions, get_model_max_tokens, get_semantic_similarity, get_token_count, invoke_model, list_models ]
    "origin": the function name of the calling function, or the frontend_origin.,
    "args": 
        for embed_text:
            "model_id": str,
            "input_text": str,
            "dimensions": int=1024,
            "input_type": str="search_query",

        for get_model_dimensions:
            "model_id": str

        for get_model_max_tokens:
            "model_id": str

        for invoke_model:
            messages: [dict],
            model_id: str,
            additional_model_req_fields: any=None, 
            additional_model_resp_field_paths: [str]=None,
            guardrail_config: dict=None, 
            inference_config: dict={},
            system: list=None, 
            tool_config: dict=None
        
        for list_models:
                none
}
"""


bedrock_provider = None

parent_path = Path(__file__).parent.resolve()
params_path = path.join(parent_path, 'bedrock_model_params.json')


with open(params_path, 'r') as params_in:
    bedrock_model_params_json = params_in.read()
    # print(f"Got bedrock_model_params before parsing: {bedrock_model_params_json}")
    bedrock_model_params = json.loads(bedrock_model_params_json)


class BedrockProviderEvent(BaseModel): 
    operation: str=''
    args: dict={
        str: Any
    }

class BedrockProvider():
    def __init__(self,
        bedrock_client = None,
        bedrock_agent_client  = None,
        bedrock_agent_rt_client = None,
        bedrock_rt_client = None,
    ):
        self.utils = utils
        if not bedrock_client:
            self.bedrock = utils.get_bedrock_client()
        else:
            # print("Used br client passed in.")
            self.bedrock = bedrock_client
        
        if not bedrock_agent_client:
            self.bedrock_agent = utils.get_bedrock_agent_client()
        else:
            # print("Used bra client passed in.")
            self.bedrock_agent = bedrock_agent_client
        
        if not bedrock_agent_rt_client:
            self.bedrock_agent_rt = utils.get_bedrock_agent_runtime_client()
        else:
            # print("Used brart client passed in.")
            self.bedrock_agent_rt = bedrock_agent_rt_client
        
        if not bedrock_rt_client:
            self.bedrock_rt = utils.get_bedrock_runtime_client()
        else:
            # print("Used brt client passed in.")
            self.bedrock_rt = bedrock_rt_client
        
        self.model_params = bedrock_model_params
    
    def embed_text(self, text, model_id, input_type='search_query', *, dimensions=1024):
        print(f"Embedding text with model {model_id} and dimensions {dimensions}")
        if model_id.startswith('cohere'):
            args = {
                "texts":[text],
                "input_type": input_type
            }
            # kwargs = {'input_type': input_type}
            # if dimensions: 
            #     kwargs['dimensions'] = dimensions
            # return self.bedrock_rt.invoke_model(model_id, text, kwargs)
        elif model_id.startswith('amazon'):
            # kwargs = {
            #     'dimensions': dimensions
            # }
            # # print(f"Calling with model {model_id}, input {text},  kwargs {kwargs}")
            # return self.invoke_model(model_id, text, kwargs)
            args = {
                "inputText": text,
                "dimensions": dimensions
            }
        else:
            raise Exception("Unknown model ID provided.")
        body = json.dumps(args).encode('utf-8')
        
        response = self.bedrock_rt.invoke_model(
            modelId=model_id,
            body=body,
            contentType = 'application/json',
            accept='*/*'
        )
        print(f"embed_text got response from bedrock_rt.invoke_model: {response}")
        body = json.loads(response['body'].read())
        # print(f"embed_text result: {body.keys()}")
        # print(f"Got response from bedrock.invoke_model: {body}")
        return body['embedding']
       
    def get_model_dimensions(self, model_id):
        if 'dimensions' in self.model_params[model_id].keys():
            return self.model_params[model_id]['dimensions']
        else:
            return 0

    def get_model_max_tokens(self, model_id):
        if not model_id:
            raise Exception("bedrock_provider.get_model_max_tokens received null model_id.")
        
        if model_id.startswith('ai21.') or \
            model_id.startswith('amazon.titan-image-generator') or \
            model_id.startswith('amazon.titan-embed'): 
            token_ct = self.model_params[model_id]['maxTokens']['default']
        elif model_id.startswith('amazon.titan-text'):
            token_ct = self.model_params[model_id]['textGenerationConfig']['maxTokenCount']['max']
        elif model_id.startswith('anthropic.claude-3'):
            token_ct = self.model_params[model_id]['maxTokens']['max']
        # elif model_id.startswith('anthropic'):
        #     token_ct = self.model_params[model_id]['max_tokens_to_sample']['max']
        elif model_id.startswith('cohere.'):
            token_ct = self.model_params[model_id]['maxTokens']['max']
        elif model_id.startswith('meta.llama2'):
            token_ct = self.model_params[model_id]['max_gen_len']['max']
        elif model_id.startswith('stability.'):
            token_ct = self.model_params[model_id]['modelMaxTokens']
        else:
            raise Exception("Unknown model ID provided.")
        
        # if model_id.startswith('amazon.titan-embed'):
        #     token_ct = int(token_ct * titan_max_tokens_modifier)
        return token_ct

    def handler(self, event: BedrockProviderEvent, context):
        print(f"Got event {event}")
        # event = BedrockProviderEvent().from_lambda_event(event)
        # print(f"converted to event {event.__dict__}")
        
        status = 200
        operation = event['operation']
        args = event['args']
        
        if operation == 'embed_text':
            model_id = args['model_id']
            text = args['input_text']
            dimensions = args['dimensions'] if 'dimensions' in args.keys() else 1024
            response = self.embed_text(text, model_id, dimensions=dimensions)
        
        elif operation == 'get_model_dimensions':
            response = self.get_model_dimensions(args['model_id'])
        
        elif operation == 'get_model_max_tokens':
            response = self.get_model_max_tokens(args['model_id'])

        elif operation == 'get_token_count':
            response = self.get_token_count(args['input_text'])

        elif operation == 'invoke_model':
            model_id = args['model_id']
            inference_config = args['inference_config'] if 'inference_config' in args else {}
            messages = args['messages'] if 'messages' in args else []
            response = self.invoke_model(
                inference_config=inference_config,
                messages=messages,
                model_id=model_id,

            )
            # print(f"invoke_model got response {response}")   
            
        elif operation == 'list_models':
            response = self.list_models()

        else: 
            raise Exception(f"Unknown operation {operation}")

        result = {
            "statusCode": status,
            "operation": operation,
            "response": response,
        }
        print(f"Bedrock_provider returning result {result}") 
        return result
        
    def invoke_model(self, *, 
        messages: [dict], 
        model_id: str, 
        additional_model_req_fields: any=None, 
        additional_model_resp_field_paths: [str]=None,
        guardrail_config: dict=None, 
        inference_config: dict={},
        system: list=None, 
        tool_config: dict=None
    ):
        content_type = 'application/json'
        accept = '*/*'
        inference_config = self._populate_default_args(model_id, inference_config)
        print(f"After merging default args, inference_config = {inference_config}")
        final_msgs = []
        for msg in messages:
            print(f"msg type: {type(msg)}")
            if isinstance(msg, str):
                msg = json.loads(msg)
            print(msg)
            print(msg.keys())
            for i in range(len(msg['content'])):
                print(f"message content array: {msg['content']}")
                print(f"type(msg[content][i]) {type(msg['content'][i])}")
                if isinstance(msg['content'][i], str):
                    print("Loading json string.")
                    msg['content'][i] = json.loads(msg['content'][i])
                if 'image' in msg['content'][i].keys():
                    print(f"image dict: {msg['content'][i]['image']}")
                    print(f"image dict type: {type(msg['content'][i]['image'])}")
                    print(f"src dict type: {type(msg['content'][i]['image']['source'])}")
                    print(msg['content'][i]['image']['source'])
                    if isinstance(msg['content'][i]['image']['source']['bytes'], str):
                        print("Converting content payload from string to bytes.")
                        msg['content'][i]['image']['source']['bytes'] = b64decode(msg['content'][i]['image']['source']['bytes'].encode('utf-8'))
            final_msgs.append(msg)
        args = {
            "modelId": model_id,
            "messages": final_msgs,
            "inferenceConfig": inference_config
        }

        if additional_model_req_fields:
            args['additionalModelRequestFields'] = additional_model_req_fields
        
        if additional_model_resp_field_paths:
            args['additionalModelResponseFieldPaths']

        if guardrail_config:
            args['guardrailConfig'] = guardrail_config

        if system:
            args['system'] = system
        
        if tool_config:
            args['toolConfig'] = tool_config
    
        response = self.bedrock_rt.converse(**args)
        print(f"invoke_model got response from bedrock_rt.invoke_model: {response}")
        return response['output']['message']['content'][0]['text']
        
    def list_models(self):
        if not hasattr(self, 'models'):
            self.models = self.bedrock.list_foundation_models()['modelSummaries']
        return self.models
    
    def _populate_default_args(self, model_id, inference_config={}):
        params = None
        alt_model_id = model_id.replace('us.', '')
        if model_id in self.model_params:
            params = self.model_params[model_id]
        elif alt_model_id in self.model_params:
            params = self.model_params[alt_model_id]
        else:
            raise Exception(f"Could not find model {model_id} or {alt_model_id} in models.")
        
        paths = params['default_paths']
        args = {
            **inference_config
        }
        for path in paths:
            parts = path.split('.')
            if len(parts) > 1:
                key = parts[-2]
            else: 
                key = parts[0]
    
            if key in inference_config:
                args[key] = inference_config[key]
            else:
                args[key] = jq.compile(f'.{path}').input_value(params).first()
        return args


def handler(event, context):
    global bedrock_provider
    if not bedrock_provider:
        bedrock_provider = BedrockProvider()
    
    return bedrock_provider.handler(event, context)