import {useEffect, useState} from 'react';
import { generateClient } from 'aws-amplify/data';
import { type Schema, IngestionStatus, VectorizationStatus } from '../../../amplify/data/resource';
import { v4 as uuidv4 } from 'uuid';
import { remove} from 'aws-amplify/storage';


const client = generateClient<Schema>();


export async function CreateJobFile(jobFile: JobFileProps) {
    console.log("CreateJobFile got JobFileProps");
    console.dir(jobFile);
    const response = await client.models.JobFile.create(jobFile);
    console.log("got response from createJobFile:");
    console.dir(response);
    return response;
}



export async function DeleteJobFiles(jobId: string, files: {name: string}[]=[]) {
    if (files.length == 0) {
        // if no files were provided we delete all of them for the given job ID.
        files = await ListJobFiles(jobId);
    }
    console.log(`Deleting ${files.length} files.`)
    files.forEach(async (file) => {
        await remove({
            path: ({ identityId }) => `private/${identityId}/jobs/${jobId}/${file.name}`
        })
        await client.models.JobFile.delete({jobId: jobId, name: file.name});
    })
}

export async function ListJobFiles(jobId: string) {
    console.log("in ListJobFiles with jobId:", jobId);
    const {data: response} = await client.models.JobFile.list({
        filter: { jobId: { eq: jobId } }
    });
    console.log("got response from listJobFiles:");
    console.dir(response);
    return response;
}

export async function GetJobFile(jobId: string, name: string) {
    console.log(`GetJobFile received jobId ${jobId} and name ${name}`);
    const {data: response} = await client.models.JobFile.get({jobId, name});
    console.log("got response from getJobFile:");
    console.dir(response);
    return response;
}


export type JobFileProps = {
    name: string;
    ingestionStatus: typeof IngestionStatus[0];
    vectorizationStatus: typeof VectorizationStatus[0];
    jobId: string;
};


export function JobFile(props: JobFileProps) {
    const [jobFile, setJobFile] = useState<JobFileProps>();
    const name = props.name;
    const ingestionStatus: string = props.ingestionStatus ?? 'NOT_STARTED';
    const vectorizationStatus = props.vectorizationStatus ?? 'NOT_STARTED';
    const jobId = props.jobId;

    useEffect(() => {
        if (jobId && name) {
            const newJobFile: JobFileProps = {
                name: name,
                jobId: jobId,
                ingestionStatus: ingestionStatus,
                vectorizationStatus: vectorizationStatus,
            };
            client.models.JobFile.create(newJobFile);
            console.log('newJobFile', newJobFile);
            setJobFile(newJobFile);
        }
    }, [jobId, name, ingestionStatus, vectorizationStatus])

    return jobFile
}

export default JobFile;

// const { errors, data: newTodo } = await client.models.Todo.create({
//     content: "My new todo",
//     isDone: true,
//   })
  