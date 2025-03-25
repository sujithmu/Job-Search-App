// components/JobListTable.tsx  (Minor change, not strictly required)
'use client';

import React, {useEffect, useState} from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Link,
    IconButton,
    Tooltip,
    Modal,
    Box,
    Typography
} from '@mui/material';
import { ContentCopy, Close } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next'; // Import i18n instance
import { decodeHtmlEntities } from '../utils/decodeHtmlEntities'; // Import the utility function

interface Language {
    name: string;
}

interface ApplicationContact {
    name?: string;
    email?: string;
    telephone?: string;
}

interface JobHit {
    id: string;
    headline: string;
    employer?: {
        name?: string;
    };
    application_details?: {
        url?: string;
        email?: string;
        other?: string;
    };
    workplace_address?: {
        municipality?: string;
    };
    must_have?: {
        languages?: Language[];
    };
    application_contacts?: ApplicationContact[];
    publication_date?: string;
    description?: {
        text_formatted?: string;
    };
}

interface JobListTableProps {
    jobs: JobHit[];
    t: any; // Receive t as prop
}

const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    maxHeight: '80vh', // Set a max height for the modal
    overflow: 'auto',
    textAlign: 'inherit'
};

const JobListTable: React.FC<JobListTableProps> = ({ jobs, t }) => {

    const [copiedEmail, setCopiedEmail] = useState<string | null>(null); // Track copied email
    const [open, setOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<JobHit | null>(null);

    // useEffect(() => {
    //     // Dynamically add job headlines to translation resources
    //     const addTranslations = () => {
    //       if (!jobs || jobs.length === 0) return;
    
    //       const newTranslations = jobs.reduce((acc: any, job) => {
    //         if (job.headline && !i18n.exists(job.headline)) {
    //           acc[job.headline] = job.headline; // Use the same value as key for default
    //         }
    //         return acc;
    //       }, {});
    
    //       if (Object.keys(newTranslations).length > 0) {
    //         i18n.addResources('en', 'translation', newTranslations); // Add to English
    //         i18n.addResources('sv', 'translation', newTranslations); // Add to Swedish,
    //         // You can call API to add the translations to backend as well
    //         //await axios.post('/api/updateTranslations',newTranslations, {
    //         //   header:{'Authorization': `Bearer ${token}`}
    //         //} )
    //       }
    //     };
    
    //     addTranslations();
    //   }, [jobs, i18n]); // Reacts when jobs or i18n changes

    const handleOpen = (job: JobHit) => {
        setSelectedJob(job);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleCopyEmail = async (email: string) => {
        try {
            await navigator.clipboard.writeText(email);
            setCopiedEmail(email); // Update state to indicate which email was copied
            setTimeout(() => {
                setCopiedEmail(null); // Clear copied state after a brief delay
            }, 2000); // Clear after 2 seconds
        } catch (err) {
            console.error('Failed to copy email:', err);
            // Handle error (e.g., show a message to the user)
        }
    };
    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="job list table">
                <TableHead>
                    <TableRow>
                        <TableCell style={{ fontWeight: 'bold' }}>Job</TableCell>
                        <TableCell style={{ fontWeight: 'bold' }}>Employer</TableCell>
                        <TableCell style={{ fontWeight: 'bold' }}>Application URL</TableCell>
                        <TableCell style={{ fontWeight: 'bold' }}>Job Location</TableCell>
                        {/* <TableCell>Language Skill Required</TableCell> */}
                        <TableCell style={{ fontWeight: 'bold' }}>Contact Details</TableCell>
                        <TableCell style={{ fontWeight: 'bold' }}>Published Date</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {jobs.map((job) => (
                        <TableRow key={job.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell component="th" scope="row" onClick={() => handleOpen(job)}
                                style={{ cursor: 'pointer' }}>
                                {t(job.headline)}
                            </TableCell>
                            <TableCell>{job.employer?.name}</TableCell>
                            <TableCell>
                                {job.application_details?.url ? (
                                    <Link href={job.application_details.url} target="_blank" rel="noopener noreferrer">
                                        Apply
                                    </Link>
                                ) : job.application_details?.email ? (
                                <>
                                    
                                        {job.application_details.email}
                                            <Tooltip
                                                title={copiedEmail === job.application_details.email ? "Copied!" : "Copy Email"}
                                                arrow
                                                placement="top"
                                            >
                                                <IconButton
                                                    aria-label="copy email"
                                                    onClick={() => handleCopyEmail(job.application_details ? job.application_details.email! : "")}
                                                    size="small"
                                                    color={copiedEmail === job.application_details.email ? 'success' : 'primary'}
                                                >
                                                    <ContentCopy />
                                                </IconButton>
                                            </Tooltip>
                                </>
                                ) : job.application_details?.other ? (
                                    <Link href={job.application_details.other}>
                                        Apply
                                    </Link>
                                
                                ) : 'N/A'}
                            </TableCell>
                            <TableCell>{job.workplace_address?.municipality}</TableCell>
                            {/* <TableCell>
                                {job.must_have?.languages?.map((lang) => lang.name).join(', ') || 'N/A'}
                            </TableCell> */}
                            <TableCell>
                                {job.application_contacts && job.application_contacts.length > 0
                                    ? job.application_contacts
                                        .map(
                                            (contact) =>
                                                {
                                                    const name = contact.name ? `💼 ${contact.name}` : '';
                                                    const email = contact.email ? `✉ ${contact.email}` : '';
                                                    const telephone = contact.telephone ? `📞 ${contact.telephone}` : '';
                                                    return [name, email, telephone].filter(Boolean).join(' ');
                                                }
                                        )
                                        .join(', ')
                                    : 'N/A'}
                            </TableCell>
                            <TableCell>
                                {job.publication_date?job.publication_date.split("T")[0] : 'N/A'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="job-description-modal"
                aria-describedby="job-description"
            >
                <Box sx={modalStyle}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                            <Typography id="job-description-modal" variant="h6" component="h2">
                                {selectedJob?.headline}
                            </Typography>
                        </Box>
                        <IconButton aria-label="close" onClick={handleClose}>
                            <Close />
                        </IconButton>
                    </Box>
                    <Typography
                      id="job-description"
                      sx={{ mt: 2 }}
                      dangerouslySetInnerHTML={{
                        __html: decodeHtmlEntities(selectedJob?.description?.text_formatted || ''),
                      }}
                    />
                </Box>
            </Modal>
        </TableContainer>
    );
};

export default JobListTable;