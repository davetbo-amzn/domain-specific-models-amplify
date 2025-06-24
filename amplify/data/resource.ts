import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

export const IngestionStatus = ['NOT_STARTED', 'COMPLETED', 'FAILED']
export const VectorizationStatus = ['NOT_STARTED', 'COMPLETED', 'FAILED']
const schema = a.schema({
  JobFile: a
    .model({
      name: a.string().required(),
      ingestionStatus: a.enum(IngestionStatus),
      vectorizationStatus: a.enum(VectorizationStatus),
      jobId: a.string().required(),
      job: a.belongsTo('Job', 'jobId'),
    })
    .identifier(['jobId', 'name'])
    .secondaryIndexes((index) => [index("jobId")])
    .authorization((allow) => [allow.owner()]),

    
    // .authorization((allow) => [
    //   allow.owner().to(["delete", "get", "list", "update"]),
    //   allow.authenticated().to(["create"]),
    // ]),
  
  Job: a
    .model({
      id: a.id(),
      jobType: a.enum(["EMBEDDINGS", "LLMS"]),
      name: a.string(),
      selectedModels: a.string(),
      createdAt: a.datetime(),
      lastUpdatedAt: a.datetime(),
      files: a.hasMany('JobFile', 'jobId'),
      ragIngestionStatus: a.enum(["NOT_STARTED", "FAILED", "IN_PROGRESS", "COMPLETED"]),
      ragIngestionStatusMessage: a.string(),
      evalDatasetGenerationStatus: a.enum(["NOT_STARTED", "FAILED", "IN_PROGRESS", "COMPLETED"]),
      evalDatasetGenerationStatusMessage: a.string(),
      evalDatasetApprovalStatus: a.enum(["NOT_STARTED", "NOT_APPROVED", "APPROVED"]),
      evalDatasetApprovalStatusMessage: a.string(),
      evalStatus: a.enum(["NOT_STARTED", "FAILED", "IN_PROGRESS", "COMPLETED"]),
      evalStatusMessage: a.string()
    })
    .authorization((allow) => [allow.owner()])
  });

  
export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
