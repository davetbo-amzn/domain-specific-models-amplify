import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../../../amplify/data/resource';
import { v4 as uuidv4 } from 'uuid';
import { JobFile } from './JobFile';
import { DeleteJobFiles } from './JobFile';


const client = generateClient<Schema>();

export enum JobType {
    LLMS = "LLMS",
    EMBEDDINGS = "EMBEDDINGS"
}

export enum EvalDatasetApprovalStatus {
    NOT_STARTED = "NOT_STARTED",
    APPROVED = "APPROVED",
    REJECTED = "NOT_APPROVED"
}

export enum EvalDatasetGenerationStatus {
    NOT_STARTED = "NOT_STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}

export enum EvalStatus {
    NOT_STARTED = "NOT_STARTED",
    FAILED = "FAILED",
    COMPLETED = "COMPLETED"
}


export enum RagIngestionStatus {
    NOT_STARTED = "NOT_STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
}

export type JobProps = {
    id: string;
    jobType: JobType;
    // userId: string;
    name: string;
    selectedModels: string; // Record<string, Record<string, any>>;
    createdAt: string;
    lastUpdatedAt: string;
    files: typeof JobFile[];
    ragIngestionStatus: RagIngestionStatus;
    ragIngestionStatusMessage: string;
    evalDatasetGenerationStatus: EvalDatasetGenerationStatus;
    evalDatasetGenerationStatusMessage: string;
    evalDatasetApprovalStatus: EvalDatasetApprovalStatus;
    evalDatasetApprovalStatusMessage: string;
    evalStatus: EvalStatus;
    evalStatusMessage: string;
};

export async function CreateJob(job: JobProps) {
    console.log("in CreateJob");
    const {data: response} = await client.models.Job.create(job);
    console.log("got response from createJob:");
    console.dir(response);
    return response;
}

export async function ListJobs() {
    console.log("in ListJobs");
    const {data: response} = await client.models.Job.list();
    console.log("got response from listJobs:");
    console.dir(response);
    return response;
}

export async function GetJob(id: string) {
    console.log("in GetJob with id:", id);
    const {data: response} = await client.models.Job.get({id});
    console.log("got response from getJob:");
    console.dir(response);
    return response;
}

export async function UpdateJob(job: JobProps) {
    console.log("in UpdateJob");
    const {data: response} = await client.models.Job.update(job);
    console.log("got response from update job:");
    console.dir(response);
    return response;
}

export async function DeleteJob(id: string) {
    await DeleteJobFiles(id);
    const response = await client.models.Job.delete({id});
    return response;
}

// export default Job;

  