import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../../../amplify/data/resource';
import { v4 as uuidv4 } from 'uuid';
import { JobFile } from './JobFile';

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
    jobId: string;
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

// export function Job(props: JobProps) {
//     console.log('Job props', props)
//     // const [job, setJob] = useState<JobProps | null>(null);

//     useEffect(() => {
//         if (! jobId) {
//             setJobId(uuidv4());
//         }
//     }, []);

//     useEffect(() => {
//         if (jobId && userId && name && selectedModels && files) {
//             const newJob: JobProps = {
//                 jobId,
//                 jobType,
//                 userId,
//                 name,
//                 selectedModels,
//                 createdAt,
//                 lastUpdatedAt,
//                 files, 
//                 ragIngestionStatus,
//                 ragIngestionStatusMessage,
//                 evalDatasetGenerationStatus,
//                 evalDatasetGenerationStatusMessage,
//                 evalDatasetApprovalStatus,
//                 evalDatasetApprovalStatusMessage,
//                 evalStatus,
//                 evalStatusMessage
//             };
//             client.models.JobFile.create(newJob);
//             console.log('newJob', newJob);
//             // setJob(newJob);
//         }
//     }, [jobId, jobType, userId, name, selectedModels, files])
// }

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


// export default Job;

  