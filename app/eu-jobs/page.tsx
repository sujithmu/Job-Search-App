'use client';

import React, { useState } from 'react';
import axios from 'axios';
import ClientOnly from '../components/ClientOnly';
import {
    Container,
    Typography,
    Box,
    Button,
    Stack,
    LinearProgress,
    CircularProgress,
    TextField,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    OutlinedInput,
    Chip,
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
    Avatar,
    SelectChangeEvent,
    Pagination as MuiPagination,
} from '@mui/material';
import { ContentCopy, Close, Public, Work } from '@mui/icons-material';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const RESULTS_PER_PAGE = 20;

const EU_COUNTRIES: { code: string; label: string }[] = [
    { code: 'at', label: 'Austria' },
    { code: 'be', label: 'Belgium' },
    { code: 'bg', label: 'Bulgaria' },
    { code: 'cy', label: 'Cyprus' },
    { code: 'cz', label: 'Czech Republic' },
    { code: 'de', label: 'Germany' },
    { code: 'dk', label: 'Denmark' },
    { code: 'ee', label: 'Estonia' },
    { code: 'el', label: 'Greece' },
    { code: 'es', label: 'Spain' },
    { code: 'fi', label: 'Finland' },
    { code: 'fr', label: 'France' },
    { code: 'hr', label: 'Croatia' },
    { code: 'hu', label: 'Hungary' },
    { code: 'ie', label: 'Ireland' },
    { code: 'is', label: 'Iceland' },
    { code: 'it', label: 'Italy' },
    { code: 'li', label: 'Liechtenstein' },
    { code: 'lt', label: 'Lithuania' },
    { code: 'lu', label: 'Luxembourg' },
    { code: 'lv', label: 'Latvia' },
    { code: 'mt', label: 'Malta' },
    { code: 'nl', label: 'Netherlands' },
    { code: 'no', label: 'Norway' },
    { code: 'pl', label: 'Poland' },
    { code: 'pt', label: 'Portugal' },
    { code: 'ro', label: 'Romania' },
    { code: 'se', label: 'Sweden' },
    { code: 'si', label: 'Slovenia' },
    { code: 'sk', label: 'Slovakia' },
    { code: 'ch', label: 'Switzerland' },
];

const LANGUAGE_OPTIONS: { isoCode: string; label: string }[] = [
    { isoCode: 'en', label: 'English' },
    { isoCode: 'de', label: 'German' },
    { isoCode: 'fr', label: 'French' },
    { isoCode: 'es', label: 'Spanish' },
    { isoCode: 'it', label: 'Italian' },
    { isoCode: 'nl', label: 'Dutch' },
    { isoCode: 'pl', label: 'Polish' },
    { isoCode: 'sv', label: 'Swedish' },
    { isoCode: 'no', label: 'Norwegian' },
    { isoCode: 'da', label: 'Danish' },
    { isoCode: 'fi', label: 'Finnish' },
    { isoCode: 'pt', label: 'Portuguese' },
    { isoCode: 'ro', label: 'Romanian' },
    { isoCode: 'cs', label: 'Czech' },
    { isoCode: 'hu', label: 'Hungarian' },
];

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
// Real EURES API response shape: { numberRecords, jvs: [...] }
interface EuresApiHit {
    jvId?: string;
    id?: string;
    title?: string;
    description?: string;
    employer?: { name?: string; logoUri?: string; website?: string };
    // Real EURES API: application details
    applicationDetails?: { url?: string; email?: string };
    // Real EURES API: location comes as a map of country-code → region codes
    locationMap?: Record<string, string[]>;
    // Real EURES API: location details (may be present in detailed fetch)
    locationDetails?: { city?: string; countryCode?: string; countryName?: string };
    // Real EURES API: timestamps in Unix milliseconds
    creationDate?: number;
    lastModificationDate?: number;
    publicationDate?: string;
    numberOfPosts?: number;
    positionOfferingCode?: string;
    positionScheduleCodes?: string[];
    euresFlag?: boolean;
    availableLanguages?: string[];
    // fallback fields
    jobVacancyId?: string;
    logoUri?: string;
}

interface EuresApiResponse {
    numberRecords?: number;
    jvs?: EuresApiHit[];
}

// ─────────────────────────────────────────────
// EURES Job Detail API types
// ─────────────────────────────────────────────
interface EuresJobLocation {
    countryCode?: string;
    region?: string;
    cityName?: string;
    postalCode?: string;
}

interface EuresJobProfile {
    title?: string;
    description?: string;
    numberOfPosts?: number;
    positionOfferingCode?: string;
    positionScheduleCodes?: string[];
    applicationInstructions?: string[]; // HTML strings, may contain <a href=...>
    locations?: EuresJobLocation[];
    employer?: { name?: string; website?: string };
    workingLanguageCodes?: string[];
}

interface EuresJobDetail {
    id?: string;
    creationDate?: number;
    jvProfiles?: Record<string, EuresJobProfile>; // keyed by lang code e.g. "sv", "en"
    preferredLanguage?: string;
}

// ─────────────────────────────────────────────
// Modal Style
// ─────────────────────────────────────────────
const modalStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    bgcolor: 'background.paper',
    border: '2px solid #1976d2',
    boxShadow: 24,
    p: 4,
    maxHeight: '80vh',
    overflow: 'auto',
    borderRadius: 2,
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function countryLabel(code: string): string {
    return EU_COUNTRIES.find((c) => c.code === code.toLowerCase())?.label ?? code.toUpperCase();
}

function stripHtml(html: string): string {
    // Return as-is; dangerouslySetInnerHTML will render it
    return html;
}

// ─────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────
export default function EuJobsPage() {
    const [keyword, setKeyword] = useState('');
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [jobs, setJobs] = useState<EuresApiHit[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    // Modal
    const [open, setOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<EuresApiHit | null>(null);
    const [jobDetail, setJobDetail] = useState<EuresJobDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

    // ── API call ────────────────────────────────
    const buildPayload = (page: number) => ({
        resultsPerPage: RESULTS_PER_PAGE,
        page,
        sortSearch: 'MOST_RECENT',
        requestLanguage: 'en',
        keywords: keyword.trim()
            ? [{ keyword: keyword.trim(), specificSearchCode: 'EVERYWHERE' }]
            : [],
        locationCodes: selectedCountries,
        requiredLanguages: selectedLanguage
            ? [{ isoCode: selectedLanguage, level: 'A1' }]
            : [],
        occupationUris: [],
        skillUris: [],
        sectorCodes: [],
        positionOfferingCodes: [],
        positionScheduleCodes: [],
        educationAndQualificationLevelCodes: [],
        euresFlagCodes: [],
        otherBenefitsCodes: [],
        requiredExperienceCodes: [],
        minNumberPost: null,
        publicationPeriod: null,
        userPreferredLanguage: null,
        sessionId: Math.random().toString(36).slice(2),
    });

    const fetchJobs = async (page: number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post<EuresApiResponse>(
                '/api/eu-jobs',
                buildPayload(page),
                { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
            );
            const raw = response.data;
            // Real EURES API shape: { numberRecords, jvs: [...] }
            const list: EuresApiHit[] = raw?.jvs ?? [];
            const total: number = raw?.numberRecords ?? 0;
            // Sort by creationDate descending (latest first)
            const sorted = [...list].sort((a, b) => (b.creationDate ?? 0) - (a.creationDate ?? 0));
            setJobs(sorted);
            setTotalCount(total);
            setCurrentPage(page);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const detail = err.response?.data?.detail ?? err.response?.data?.error ?? err.message;
                setError(`API error ${err.response?.status ?? ''}: ${detail}`);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred.');
            }
            setJobs([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
            setHasSearched(true);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchJobs(1);
    };

    const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
        fetchJobs(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCountryChange = (event: SelectChangeEvent<string[]>) => {
        const v = event.target.value;
        setSelectedCountries(typeof v === 'string' ? v.split(',') : v);
    };

    // ── Modal ───────────────────────────────────
    const handleOpen = async (job: EuresApiHit) => {
        setSelectedJob(job);
        setJobDetail(null);
        setOpen(true);
        // Fetch detailed job info to get applicationInstructions
        const jobId = job.jvId ?? job.id ?? job.jobVacancyId;
        if (!jobId) return;
        setLoadingDetail(true);
        try {
            const res = await fetch(`/api/eu-jobs/${encodeURIComponent(jobId)}`);
            if (res.ok) {
                const detail: EuresJobDetail = await res.json();
                setJobDetail(detail);
            }
        } catch { /* silently ignore – modal still works without detail */ }
        finally { setLoadingDetail(false); }
    };
    const handleClose = () => { setOpen(false); setJobDetail(null); };
    const handleCopyEmail = async (email: string) => {
        try {
            await navigator.clipboard.writeText(email);
            setCopiedEmail(email);
            setTimeout(() => setCopiedEmail(null), 2000);
        } catch { /* ignore */ }
    };

    /**
     * Extract the first href URL from the applicationInstructions HTML strings.
     * e.g. '<a href="https://..." rel="nofollow">Link...</a>' → 'https://...'
     */
    const extractDetailApplyUrl = (detail: EuresJobDetail | null): string | undefined => {
        if (!detail?.jvProfiles) return undefined;
        // Try preferred language first, then any available profile
        const profiles = Object.values(detail.jvProfiles);
        for (const profile of profiles) {
            for (const instruction of profile.applicationInstructions ?? []) {
                const match = instruction.match(/href="([^"]+)"/);
                if (match && match[1] && !match[1].startsWith('mailto:')) {
                    return match[1];
                }
            }
        }
        return undefined;
    };

    /**
     * Get the best location string from detail (city-level), fallback to list-level.
     */
    const getDetailLocation = (detail: EuresJobDetail | null, fallback: string): string => {
        if (!detail?.jvProfiles) return fallback;
        const profiles = Object.values(detail.jvProfiles);
        for (const profile of profiles) {
            const loc = profile.locations?.[0];
            if (loc) {
                const city = loc.cityName;
                const country = loc.countryCode ? countryLabel(loc.countryCode) : '';
                if (city && country) return `${city}, ${country}`;
                if (city) return city;
                if (country) return country;
            }
        }
        return fallback;
    };

    // ── Field accessors (matched to real EURES API shape) ────────────
    const getTitle = (j: EuresApiHit): string => j.title ?? '—';
    const getEmployer = (j: EuresApiHit): string => j.employer?.name ?? '—';
    const getLogo = (j: EuresApiHit): string | undefined => j.employer?.logoUri ?? j.logoUri;

    /**
     * Location: prefer locationDetails (city + country), else derive from locationMap keys.
     * Real EURES API returns locationMap: { "SE": ["SE110"], ... }
     */
    const getLocation = (j: EuresApiHit): string => {
        // Try structured locationDetails first
        const city = j.locationDetails?.city;
        const countryCode = j.locationDetails?.countryCode;
        const countryName = j.locationDetails?.countryName;
        if (city || countryCode || countryName) {
            const country = countryCode ? countryLabel(countryCode) : (countryName ?? '');
            return city && country ? `${city}, ${country}` : (city ?? country) || '—';
        }
        // Fallback: derive from locationMap keys
        if (j.locationMap && Object.keys(j.locationMap).length > 0) {
            const countries = Object.keys(j.locationMap)
                .map((code) => countryLabel(code))
                .join(', ');
            return countries || '—';
        }
        return '—';
    };

    const getApplyUrl = (j: EuresApiHit): string | undefined => j.applicationDetails?.url;

    /**
     * Apply email: prefer applicationDetails.email, else extract first mailto: from description HTML.
     */
    const getApplyEmail = (j: EuresApiHit): string | undefined => {
        if (j.applicationDetails?.email) return j.applicationDetails.email;
        // Fallback: extract first mailto href from description
        if (j.description) {
            const match = j.description.match(/href="mailto:([^"]+)"/);
            if (match) return match[1];
        }
        return undefined;
    };

    /**
     * Available languages for this job (ISO codes → human labels).
     */
    const getLanguages = (j: EuresApiHit): string[] => {
        if (!j.availableLanguages || j.availableLanguages.length === 0) return [];
        return j.availableLanguages.map((iso) => {
            const found = LANGUAGE_OPTIONS.find((l) => l.isoCode === iso.toLowerCase());
            return found ? found.label : iso.toUpperCase();
        });
    };

    /**
     * Publication date: prefer publicationDate string, else format creationDate (Unix ms).
     */
    const getPubDate = (j: EuresApiHit): string => {
        if (j.publicationDate) return j.publicationDate.split('T')[0];
        if (j.creationDate) {
            return new Date(j.creationDate).toISOString().split('T')[0];
        }
        return '—';
    };

    const totalPages = Math.ceil(totalCount / RESULTS_PER_PAGE);

    // ─────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────
    return (
        <ClientOnly>
        <Container maxWidth="lg" sx={{ py: 4 }}>

            {/* Header */}
            <Box mb={3} display="flex" alignItems="center" gap={1.5}>
                <Public sx={{ fontSize: 36, color: '#003399' }} />
                <Box>
                    <Typography variant="h4" fontWeight={700}>
                        Search for Jobs across Europe
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Powered by the EURES European Job Mobility Portal
                    </Typography>
                </Box>
            </Box>

            {/* Search Form */}
            <Box
                component="form"
                onSubmit={handleSearch}
                sx={{ bgcolor: '#f5f7fa', border: '1px solid #e0e0e0', borderRadius: 2, p: 3, mb: 3 }}
            >
                <Stack spacing={2}>
                    <TextField
                        label="Job Title / Keywords"
                        placeholder='e.g. "Software Engineer" or "Infor M3 ERP"'
                        variant="outlined"
                        fullWidth
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        slotProps={{ input: { startAdornment: <Work sx={{ mr: 1, color: 'text.secondary' }} /> } }}
                    />

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        {/* Country multi-select */}
                        <FormControl fullWidth>
                            <InputLabel id="country-label">Countries</InputLabel>
                            <Select
                                labelId="country-label"
                                multiple
                                value={selectedCountries}
                                onChange={handleCountryChange}
                                input={<OutlinedInput label="Countries" />}
                                renderValue={(sel) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {(sel as string[]).map((code) => (
                                            <Chip key={code} label={countryLabel(code)} size="small" />
                                        ))}
                                    </Box>
                                )}
                                MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                            >
                                {EU_COUNTRIES.map((c) => (
                                    <MenuItem key={c.code} value={c.code}>{c.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Language filter (no level) */}
                        <FormControl sx={{ minWidth: 180 }}>
                            <InputLabel id="lang-label">Required Language</InputLabel>
                            <Select
                                labelId="lang-label"
                                value={selectedLanguage}
                                label="Required Language"
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                            >
                                <MenuItem value=""><em>Any</em></MenuItem>
                                {LANGUAGE_OPTIONS.map((l) => (
                                    <MenuItem key={l.isoCode} value={l.isoCode}>{l.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>

                    <Box>
                        <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ minWidth: 140 }}>
                            Search
                        </Button>
                        {selectedCountries.length > 0 && (
                            <Button variant="text" size="small" sx={{ ml: 2 }} onClick={() => setSelectedCountries([])}>
                                Clear countries
                            </Button>
                        )}
                    </Box>
                </Stack>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}
            {error && <Typography color="error" align="center" mb={2}>Error: {error}</Typography>}
            {!loading && hasSearched && jobs.length === 0 && !error && (
                <Typography align="center" color="text.secondary">
                    No jobs found. Try different keywords or countries.
                </Typography>
            )}

            {jobs.length > 0 && (
                <>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                            Showing {(currentPage - 1) * RESULTS_PER_PAGE + 1}–
                            {Math.min(currentPage * RESULTS_PER_PAGE, totalCount)} of{' '}
                            <strong>{totalCount.toLocaleString()}</strong> results
                        </Typography>
                    </Stack>

                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                        <Table sx={{ minWidth: 650 }} aria-label="EU job list table">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f0f4ff' }}>
                                    <TableCell style={{ fontWeight: 'bold' }} />
                                    <TableCell style={{ fontWeight: 'bold' }}>Job</TableCell>
                                    <TableCell style={{ fontWeight: 'bold' }}>Employer</TableCell>
                                    <TableCell style={{ fontWeight: 'bold' }}>Application</TableCell>
                                    <TableCell style={{ fontWeight: 'bold' }}>Location</TableCell>
                                    <TableCell style={{ fontWeight: 'bold' }}>Languages</TableCell>
                                    <TableCell style={{ fontWeight: 'bold' }}>Published Date</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {jobs.map((job, idx) => {
                                    const applyUrl = getApplyUrl(job);
                                    const applyEmail = getApplyEmail(job);
                                    const logo = getLogo(job);
                                    const id = job.jvId ?? job.id ?? job.jobVacancyId ?? String(idx);

                                    return (
                                        <TableRow key={id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell>
                                                {logo ? (
                                                    <Avatar
                                                        src={logo}
                                                        alt={getEmployer(job)}
                                                        variant="rounded"
                                                        sx={{ width: 56, height: 40, objectFit: 'contain' }}
                                                    />
                                                ) : (
                                                    <Avatar
                                                        variant="rounded"
                                                        sx={{ width: 40, height: 40, bgcolor: '#003399', fontSize: 14 }}
                                                    >
                                                        {getEmployer(job).charAt(0).toUpperCase()}
                                                    </Avatar>
                                                )}
                                            </TableCell>

                                            <TableCell
                                                component="th"
                                                scope="row"
                                                onClick={() => handleOpen(job)}
                                                sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 500 }}
                                            >
                                                {getTitle(job)}
                                            </TableCell>

                                            <TableCell>{getEmployer(job)}</TableCell>

                                            {/* Application: URL link > email with copy > N/A */}
                                            <TableCell>
                                                {applyUrl ? (
                                                    <Link href={applyUrl} target="_blank" rel="noopener noreferrer">Apply</Link>
                                                ) : applyEmail ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <Link href={`mailto:${applyEmail}`} sx={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                                            {applyEmail}
                                                        </Link>
                                                        <Tooltip title={copiedEmail === applyEmail ? 'Copied!' : 'Copy Email'} arrow placement="top">
                                                            <IconButton
                                                                size="small"
                                                                color={copiedEmail === applyEmail ? 'success' : 'primary'}
                                                                onClick={() => handleCopyEmail(applyEmail!)}
                                                            >
                                                                <ContentCopy fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                ) : 'N/A'}
                                            </TableCell>

                                            <TableCell>{getLocation(job)}</TableCell>

                                            {/* Languages */}
                                            <TableCell>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {getLanguages(job).length > 0
                                                        ? getLanguages(job).map((lang) => (
                                                            <Chip key={lang} label={lang} size="small" variant="outlined" />
                                                        ))
                                                        : '—'}
                                                </Box>
                                            </TableCell>

                                            <TableCell>{getPubDate(job)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {totalPages > 1 && (
                        <Box display="flex" justifyContent="center" mb={4}>
                            <MuiPagination
                                count={totalPages}
                                page={currentPage}
                                onChange={handlePageChange}
                                color="primary"
                                shape="rounded"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    )}
                </>
            )}

            {/* Job Detail Modal */}
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="eu-job-modal-title"
                aria-describedby="eu-job-modal-desc"
            >
                <Box sx={modalStyle}>
                    {/* Header row */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                            <Typography id="eu-job-modal-title" variant="h6" component="h2" fontWeight={700}>
                                {selectedJob ? getTitle(selectedJob) : ''}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mt={0.5}>
                                {selectedJob ? getEmployer(selectedJob) : ''}
                                {selectedJob && getDetailLocation(jobDetail, getLocation(selectedJob)) !== '—'
                                    ? ` · ${getDetailLocation(jobDetail, getLocation(selectedJob))}` : ''}
                            </Typography>
                            {selectedJob && getLogo(selectedJob) && (
                                <Avatar
                                    src={getLogo(selectedJob)}
                                    alt={selectedJob ? getEmployer(selectedJob) : ''}
                                    variant="rounded"
                                    sx={{ width: 160, height: 70, mt: 1, objectFit: 'contain', borderRadius: 0 }}
                                />
                            )}
                        </Box>
                        <IconButton aria-label="close" onClick={handleClose}><Close /></IconButton>
                    </Box>

                    {/* Meta chips */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                        {selectedJob && getPubDate(selectedJob) !== '—' && (
                            <Chip label={`Published: ${getPubDate(selectedJob)}`} size="small" />
                        )}
                        {selectedJob && getDetailLocation(jobDetail, getLocation(selectedJob)) !== '—' && (
                            <Chip label={`📍 ${getDetailLocation(jobDetail, getLocation(selectedJob))}`} size="small" color="primary" variant="outlined" />
                        )}
                        {loadingDetail && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={16} />
                                <Typography variant="caption" color="text.secondary">Loading apply info…</Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Description */}
                    <Typography
                        id="eu-job-modal-desc"
                        sx={{ mt: 2 }}
                        dangerouslySetInnerHTML={{
                            __html: stripHtml(
                                selectedJob?.description ?? '<p><em>No description available.</em></p>'
                            ),
                        }}
                    />

                    {/* Action buttons */}
                    <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {/* Priority 1: URL from applicationInstructions (detail fetch) */}
                        {extractDetailApplyUrl(jobDetail) && (
                            <Button
                                variant="contained" color="primary"
                                href={extractDetailApplyUrl(jobDetail)!}
                                target="_blank" rel="noopener noreferrer"
                            >
                                Apply Now
                            </Button>
                        )}
                        {/* Priority 2: URL from applicationDetails in list response */}
                        {!extractDetailApplyUrl(jobDetail) && selectedJob && getApplyUrl(selectedJob) && (
                            <Button
                                variant="contained" color="primary"
                                href={getApplyUrl(selectedJob)!} target="_blank" rel="noopener noreferrer"
                            >
                                Apply Now
                            </Button>
                        )}
                        {/* Priority 3: Email (from applicationDetails or extracted from description) */}
                        {selectedJob && getApplyEmail(selectedJob) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Button
                                    variant="outlined" color="primary"
                                    href={`mailto:${getApplyEmail(selectedJob)}`}
                                >
                                    {getApplyEmail(selectedJob)}
                                </Button>
                                <Tooltip
                                    title={copiedEmail === getApplyEmail(selectedJob) ? 'Copied!' : 'Copy Email'}
                                    arrow placement="top"
                                >
                                    <IconButton
                                        size="small"
                                        color={copiedEmail === getApplyEmail(selectedJob) ? 'success' : 'primary'}
                                        onClick={() => handleCopyEmail(getApplyEmail(selectedJob)!)}
                                    >
                                        <ContentCopy fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )}
                        <Button variant="outlined" onClick={handleClose}>Close</Button>
                    </Box>
                </Box>
            </Modal>
        </Container>
        </ClientOnly>
    );
}
