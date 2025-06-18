import {useEffect, useState} from 'react';
import { generateClient } from 'aws-amplify/data';
import { type Schema, IngestionStatus, VectorizationStatus } from '../../../amplify/data/resource';
import { v4 as uuidv4 } from 'uuid';


const client = generateClient<Schema>();


export async function ListJobFiles(jobId: string) {
    const {data: job} = await client.models.Job.get({id: jobId});
    if (job) {
        const {data: response} = await job.files();
        return response;
    }
    else {
        return [];
    }
}


export type JobFileProps = {
    jobFileId: string;
    name: string;
    location: string;
    ingestionStatus: typeof IngestionStatus[0];
    vectorizationStatus: typeof VectorizationStatus[0];
    jobId: string;
    key: string;
};


export function JobFile(props: JobFileProps) {
    const jobFileId = props.jobFileId ?? uuidv4();
    const [jobFile, setJobFile] = useState<JobFileProps>();
    const name = props.name;
    const location = props.location;
    const ingestionStatus: string = props.ingestionStatus ?? 'NOT_STARTED';
    const vectorizationStatus = props.vectorizationStatus ?? 'NOT_STARTED';
    const jobId = props.jobId;

    useEffect(() => {
        if (jobFileId && location) {
            const newJobFile: JobFileProps = {
                jobFileId: jobFileId,
                name: name,
                jobId: jobId,
                location: location,
                ingestionStatus: ingestionStatus,
                vectorizationStatus: vectorizationStatus,
                key: jobFileId
            };
            client.models.JobFile.create(newJobFile);
            console.log('newJobFile', newJobFile);
            setJobFile(newJobFile);
        }
    }, [jobFileId, location, name, ingestionStatus, vectorizationStatus, jobId])

    return jobFile
}

export default JobFile;

// const { errors, data: newTodo } = await client.models.Todo.create({
//     content: "My new todo",
//     isDone: true,
//   })
  