//  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
//  SPDX-License-Identifier: MIT-0
import {v4 as uuidv4 } from 'uuid';
import { FormEvent, useEffect, useState } from 'react';
import { Button, Checkbox, Container, Form, FormField, Header, Input, RadioGroup, SpaceBetween, Spinner, Tabs, Multiselect, Box } from '@cloudscape-design/components';
import { useParams } from 'react-router-dom';
import DeleteConfirmationModal from '../common/DeleteConfirmationModal'
import { CreateJob, JobProps, JobType, EvalDatasetApprovalStatus, EvalDatasetGenerationStatus, EvalStatus, ListJobs, RagIngestionStatus } from './Job'
import UploadedDocumentsTable from './UploadedDocumentsTable'
import config from '../../config.json';
import { Cache } from 'aws-amplify/utils';

// async function getTableProvider(urlJobId: string, limit=20, lastEvalKey='') {
//   //// console.log("newApi:")
//   //// console.dir(provider)
//   if (!urlJobId) {
//     return []
//   }
//   const data = await api.listUploadedFiles(urlJobId: string, limit, lastEvalKey);
//   console.log("getTableProvider received data:")
//   console.dir(data)
//   return data;
// }

// const filePageSize = 20

function JobForm() {
  const urlParams = useParams()
  const path: string = window.location.hash;
  const [jobId, setJobId] = useState(null);
  const [jobType, setJobType] = useState(null);
  const [name, setName] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [createdAt, setCreatedAt] = useState('');
  const [lastUdatedAt, setLastUpdatedAt] = useState('');
  const [ragIngestionStatus, setRagIngestionStatus] = useState<RagIngestionStatus>(RagIngestionStatus.NOT_STARTED);
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdate, setIsUpdate] = useState(true);
  const [submitDisabled, setSubmitDisabled] = useState(true)
  const [uploadedFiles, setUploadedFiles] = useState([])

  useEffect(() => {
    (async () => {
      if (path === '#/jobs/create') {
        if (!jobId && isLoading) {
          // Check if there's a cached jobId
          const cachedJobId = await Cache.getItem('current_job_id');
          
          if (cachedJobId) {
            setJobId(cachedJobId);
            console.log('retrieved cached jobId: ' + cachedJobId);
          } else {
            const newJobId = uuidv4();
            setJobId(newJobId);
            // Save to cache
            Cache.setItem('current_job_id', newJobId);
            console.log('created new jobId: ' + newJobId);
          }
          
          setIsUpdate(false);
          setIsLoading(false);
        }
      }
      else {
          if (jobId) {
            setIsUpdate(false)
          }
          if (urlParams.id) {
              setJobId(urlParams.id);
              console.log('got jobId from urlParams: ' + urlParams.id);
              setIsUpdate(true);
          }
      }
    })()
  }, [])

  useEffect(() => {
    if (jobType) {
      console.log(`Got new jobType ${jobType}`)
    }
  },[jobType])
  // useEffect(() => {
  //   console.log("params updated:")
  //   console.dir(params)
  //   if (params && params?.id) {
  //     console.log('params.id: ' + params.id)
  //     setUrlJobId(params.id)
  //   }
  // }, [params])
  
  useEffect(() => {
    (async () => {
      if (jobId) {
        console.log(`got jobId ${jobId}`);
        // let result = await ListJobs()
        // console.log(`Got object data result: `)
        // console.dir(result)
        setIsLoading(false)
        // for (let i = 0; i < result.length; i++) {
        //   let tmpCollection = result[i]
        //   console.log("Got tmpCollection")
        //   console.dir(tmpCollection)
        //   console.log(`enrichmentPipelines == ${JSON.stringify(tmpCollection.enrichment_pipelines)}`)
        //   // console.log(`tmpCollection.enrichment_pipelines.entity_extraction.enabled = ${tmpCollection.enrichment_pipelines.entity_extraction.enabled}`)
        //   // tmpCollection.enrichment_pipelines = tmpCollection.enrichment_pipelines.replaceAll(': True', ': true').replaceAll("'", "\"")
        //   // console.log(`tmpCollection.enrichment_pipelines before JSON.parse = ${tmpCollection.enrichment_pipelines}`)
        //   // tmpCollection.enrichment_pipelines = JSON.parse(tmpCollection.enrichment_pipelines)
        //   console.log(`tmpCollection.enrichment_pipelines after JSON.parse = ${JSON.stringify(tmpCollection.enrichment_pipelines)}`)
        //   console.log(`tmpCollection.collection_id: ${tmpCollection.collection_id} == urlJobId ${urlJobId}? ${tmpCollection.collection_id === urlJobId}`)
        //   console.log(`does collection_id ${tmpCollection.collection_id} === urlJobId ${urlJobId}?`)
        //   if (tmpCollection.collection_id === urlJobId) {
        //     let tmpCollectionObj = new Job(
        //       tmpCollection.user_email,
        //       tmpCollection.collection_name,
        //       tmpCollection.description,
        //       tmpCollection.vector_db_type,
        //       tmpCollection.vector_ingestion_enabled,
        //       tmpCollection.file_storage_tool_enabled,
        //       tmpCollection.collection_id,
        //       tmpCollection.shared_with,
        //       tmpCollection.enrichment_pipelines,
        //       tmpCollection.graph_schema,
        //       tmpCollection.created_date,
        //       tmpCollection.updated_date,
        //     ) 
        //     console.log("Converted to Job:")
        //     console.dir(tmpCollectionObj)
        //     console.log(`Got match for collection ${tmpCollectionObj.json()}}`)
        //     // setCurrentCollection(tmpCollection)
        //     // setCollectionName(tmpCollection.collection_name.trim());
        //     // setCollectionDescription(tmpCollection.description.trim());
        //     let sharedList = []
        //     tmpCollectionObj.shareList.forEach(email => {
        //       sharedList.push({
        //         "key": email
        //       })
        //     })
        //     setCurrentCollection(tmpCollectionObj)
        //     // setCollectionShareList(sharedList)
        //     console.log('tmpCollectionObj')
        //     console.dir(tmpCollectionObj)
        //     break;
        //   }
        // }
      }
      else {
        // console.log("Collection ID is " + urlJobId)
      }
    })()
    // console.log('selectedVectorEngine: '+ selectedVectorEngine['label']);
  }, [jobId])

  // useEffect( () => {
  //   // const onBeforeUnload = (ev) => {
  //   //   setCurrentCollection({})
  //   //   setUrlJobId(null)
  //   //   setCollectionShareList(null)
  //   //   setCurrentPageIndex(0)
  //   //   setLastEvalKey('')
  //   // };
  //   // window.addEventListener("beforeunload", onBeforeUnload);
  //   const deleteConfMsg = defaultDeleteConfirmationMessage.replace('{currentCollection.name}', currentCollection.name)
  //   setDeleteConfirmationMessage(deleteConfMsg)
  //   checkEnableSubmit()
  //   // return () => {
  //   //   window.removeEventListener("beforeunload", onBeforeUnload);
  //   // };
  // }, [currentCollection])

  // function checkEnableSubmit() {
  //   if (currentCollection && currentCollection.name !== '' && 
  //      currentCollection.description !== '') {
  //     setSubmitDisabled(false);
  //   }
  //   else {
  //     setSubmitDisabled(true)
  //   }
  // }

  // function confirmDeleteCollection(evt) {
  //   // console.log(`confirming delete collection ${urlJobId}`)
  //   setConfirmationModal(
  //     <DeleteConfirmationModal
  //       message={deleteConfirmationMessage}
  //       deleteFn={deleteCollection}
  //       deleteRedirectLocation={'#/document-collections'}
  //       resourceId={urlJobId}
  //       visible={true}
  //     />
  //   )
  //   setDeleteModalVisible(true)
  //   // api.deleteDocCollection(evt.urlJobId)
  // }
  
  // function deleteCollection(collectionId) {
  //   api.deleteDocCollection(collectionId)
  //   setDeleteModalVisible(false)
  // }

  function getLoadingPageContent() {
    return (
      <>
        <div style={{textAlign: "center"}}>
          Loading<br/>
          <Spinner size="large"/>
        </div>
      </>
    )
  }
  // Helper function to render model selection based on job type
  const ModelSelection = () => {
    if (!jobType) return null;
    
    const modelType = jobType === 'LLMS' ? 'llms' : 'embeddings';
    const models = config[modelType];
    
    if (!models) return null;
    
    const handleModelSelect = (modelName: string) => {
      if (selectedModels.includes(modelName)) {
        setSelectedModels(selectedModels.filter(model => model !== modelName));
      } else {
        setSelectedModels([...selectedModels, modelName]);
      }
    };
    
    return (
      <FormField key='modelSelection' label="Available Models">
        <Container>
          <SpaceBetween direction="vertical" size="l">
            {Object.keys(models).map(provider => (
              <div key={provider}>
                <Box variant="h5">{provider.charAt(0).toUpperCase() + provider.slice(1)}</Box>
                <SpaceBetween direction="vertical" size="xs">
                  {Object.keys(models[provider])
                    .filter(key => key !== 'openai_key')
                    .map(model => (
                      <Checkbox
                        key={model}
                        checked={selectedModels.includes(model)}
                        onChange={() => handleModelSelect(model)}
                      >
                        {model}
                      </Checkbox>
                    ))
                  }
                </SpaceBetween>
              </div>
            ))}
          </SpaceBetween>
        </Container>
      </FormField>
    );
  };

  function getPageContent() {

    return (
      <>
        <form onSubmit={e => {
          e.preventDefault();
          sendData(e);
        }}>
        <Form className="JobForm"
          actions={
            <SpaceBetween key="sb0" direction="horizontal" size="xs">
              <Button formAction="cancel" variant="link">
                Cancel
              </Button>
              <Button 
                formAction='submit'
                loading={isLoading}
                variant="primary"
                onClick={sendData}
              >Save</Button>
              {/* <Button 
                id='confirmDeleteDocCollection'
                formAction='none'
                loading={isDeleting}
                variant="normal"
                // onClick={confirmDeleteCollection}
              >Delete Job</Button> */}
            </SpaceBetween>
          }>
          <Container>
            <SpaceBetween key="sb1" direction="vertical" size="l">
              {!isUpdate ?
              <>
                <FormField key='name' label="Job Name">
                <Input
                  key='name'
                  onChange={({ detail }) => setName(detail.value)}
                  value={ name ?? ''}
                />
                </FormField>
              </>
              : 
              <>
                <FormField key='name' label="Job Name">
                <Input
                  key='name'
                  onChange={({ detail }) => setName(detail.value)}
                  value={name ?? ''}
                  disabled
                />
                </FormField>
              </>
              }
              
              <FormField key='jobType' label="Job Type">
                <RadioGroup
                  onChange={({ detail }) => setJobType(detail.value)}
                  value={jobType}
                  items={[
                    { value: "LLMS", label: "LLMs" },
                    { value: "EMBEDDINGS", label: "Embeddings" }
                  ]}
                />
              </FormField>
              
              {jobType && <ModelSelection />}
              
              { jobId ?
                <SpaceBetween size="l" key="sb2" >
                <UploadedDocumentsTable
                          jobId={jobId}
                        ></UploadedDocumentsTable></SpaceBetween> : ''
              }
            </SpaceBetween>
          </Container>
        </Form>
      </form>
        {/* {confirmationModal} */}
      </>)
  }
  async function sendData(evt: FormEvent<HTMLFormElement>){
    evt.preventDefault()
    // setIsLoading(true)
    
    if (jobId !== null) {
      try {
        // Create a new job using the Job object
        const jobProps: JobProps = {
          jobId: jobId,
          jobType: jobType !== null ? jobType : JobType.LLMS,
          // userId: 'current-user', // This would typically come from authentication
          name: name,
          selectedModels: JSON.stringify(selectedModels),
          createdAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
          files: [],
          ragIngestionStatus: RagIngestionStatus.NOT_STARTED,
          ragIngestionStatusMessage: '',
          evalDatasetGenerationStatus: EvalDatasetGenerationStatus.NOT_STARTED,
          evalDatasetGenerationStatusMessage: '',
          evalDatasetApprovalStatus: EvalDatasetApprovalStatus.NOT_STARTED,
          evalDatasetApprovalStatusMessage: '',
          evalStatus: EvalStatus.NOT_STARTED,
          evalStatusMessage: ''
        };
        console.log('creating job with props')
        console.dir(jobProps)
        const response = await CreateJob(jobProps);
        console.log("Job creation response:", response);
        
        // Clear the cached jobId since job was created successfully
        Cache.removeItem('current_job_id');
        
        // Redirect to the job details page
        if (!isUpdate) {
          location.hash = `#/jobs/${jobId}`;
        }
      } catch (error) {
        console.error("Error creating job:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }

  // async function updateCurrentCollection(key, value) {
  //   let tmp = {}
  //   if (typeof(currentCollection) == Job) {
  //     tmp = currentCollection.clone()
  //   }
  //   else {
  //     tmp = JSON.parse(JSON.stringify(currentCollection))
  //   }
  //   tmp[key] = value
  //   setCurrentCollection(tmp)
  // }

  // async function updateDocCollectionEnrichmentPipelines(pipelines) {
  //   let tmp = JSON.parse(JSON.stringify(currentCollection))
  //   tmp.enrichment_pipelines = pipelines
  //   setCollection(tmp)
  //   console.log("DocumentCollectionForm updating currentCollection to")
  //   console.dir(tmp)
  //   console.dir(pipelines)
  //   setDocCollectionEnrichmentPipelines(pipelines)
  // }

  // async function updatePageIndex(indexNum) {
  //   // console.log(`updatePageIndex setting currentPageIndex to ${indexNum}`)
  //   let lastKey = ''
  //   if (indexNum > currentPageIndex) {
  //     // page up
  //   }
  //   else {
  //     // page down
  //   }
  //   setCurrentPageIndex(indexNum)
  //   // let tmpFiles = await getTableProvider(urlJobId, filePageSize, uploadedFiles.splice(-1)['file_name'])
  //   // // console.log("Got uploadedFiles:")
  //   // // console.dir(tmpFiles)
  //   // // console.log("Got uploadedFiles:")
  //   // // console.dir(uploadedFiles)
  //   // // console.log(`lastEval record `)
  //   // // console.dir(uploadedFiles['files'].splice(-1))
  //   // setLastEvalKey(uploadedFiles['files'].splice(-1)['file_name'])
  //   // setUploadedFiles(uploadedFiles['files'])
  // }

  return (
    <>
      { isLoading ? getLoadingPageContent() : getPageContent() }
    </>
  );
}

export default JobForm;