'use client'; // Mark this component as a client component

import React, { useState } from 'react';
import JobSearchForm from './components/JobSearchForm'; // Use "@/components" alias
import JobListTable from './components/JobListTable';
import Pagination from './components/Pagination';
import axios from 'axios';
import { Container, Typography, Box, Button, Stack, LinearProgress } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useTranslation } from 'react-i18next'; // Import useTranslation

i18n.use(initReactI18next).init({
    resources: {
      en: {
        translation: {
            "Copied!": "Copied!",
  
        },
      },
      sv: {
        translation: {
  
          "Copied!": "Kopierat!",
        },
      },
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });
const ITEMS_PER_PAGE = 10;

// Define types for the API response data
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
    };
    workplace_address?: {
        municipality?: string;
    };
    must_have?: {
        languages?: Language[];
    };
    application_contacts?: ApplicationContact[];
    publication_date?: string; // Add publication_date
}

interface ApiResponse {
    hits: JobHit[];
    total: {
        value: number;
    };
}

type SortDirection = 'asc' | 'desc' | null;

const Home: React.FC = () => {
    const [jobs, setJobs] = useState<JobHit[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [sortColumn, setSortColumn] = useState<'publication_date' | null>('publication_date'); // Default sort column
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // Default sort direction

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      const response = await axios.get<ApiResponse>(
        `https://jobsearch.api.jobtechdev.se/search?q=${query}&limit=100`
      );

      let fetchedJobs = response.data.hits || [];

      // Sort the data by publication_date in descending order initially
      fetchedJobs = sortJobs(fetchedJobs, 'publication_date', 'desc');

      // Add translations dynamically in parent
    //   if (fetchedJobs && fetchedJobs.length > 0) {
    //     const newTranslations = fetchedJobs.reduce((acc: any, job) => {
    //       if (job.headline && !i18n.exists(job.headline)) {
    //         acc[job.headline] = job.headline; // Use the same value as key for default
    //       }
    //       return acc;
    //     }, {});
    //     if (Object.keys(newTranslations).length > 0) {
    //       i18n.addResources('en', 'translation', newTranslations);
    //       i18n.addResources('sv', 'translation', newTranslations);
    //     }
    //   }
      setJobs(fetchedJobs);
      setTotalItems(response.data.total.value);
      console.log("response.data.total", response.data.total.value) //check if this value is being populated or not
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error('Error fetching jobs:', err);
            setError(err.message || 'An error occurred while fetching jobs.');
          } else {
            console.error('Unknown error:', err);
            setError('An unknown error occurred while fetching jobs.');
          }
      setJobs([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handleSort = (column: 'publication_date') => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const sortJobs = (jobsToSort: JobHit[], column: 'publication_date', direction: SortDirection): JobHit[] => {
        if (!column || !direction) {
            return jobsToSort;
        }

        return [...jobsToSort].sort((a, b) => {
            const dateA = new Date(a[column] || 0).getTime();  // Handle potentially missing dates
            const dateB = new Date(b[column] || 0).getTime();

            if (direction === 'asc') {
                return dateA - dateB;
            } else {
                return dateB - dateA;
            }
        });
    };


    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    // Apply sorting to currentJobs
    const currentJobs = sortJobs(jobs.slice(startIndex, endIndex), sortColumn || 'publication_date', sortDirection || 'desc');

    return (
        <Container maxWidth="lg">
            {/*<AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Job Search Application
                    </Typography>
                    <IconButton
                        size="large"
                        edge="end"
                        color="inherit"
                        aria-label="translate to English"
                        onClick={() => changeLanguage('en')}
                    >
                        <Translate />
                    </IconButton>
                </Toolbar>
            </AppBar>*/}
            <Box mt={4} mb={2}>
                <Typography variant="h4" align="left">
                    Search for jobs in Sweden
                </Typography>
            </Box>

            <JobSearchForm onSearch={handleSearch} />

            {/* {loading && <Typography align="center">Loading...</Typography>} */}
            {loading && <LinearProgress />} {/* Add LinearProgress */}
            {error && (
                <Typography color="error" align="center">
                    Error: {error}
                </Typography>
            )}

            {jobs.length > 0 && (
                <>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography>Sort by:</Typography>
                        <Button
                            onClick={() => handleSort('publication_date')}
                            variant="outlined"
                            startIcon={sortColumn === 'publication_date' && sortDirection === 'asc' ? <ArrowUpward /> : sortColumn === 'publication_date' && sortDirection === 'desc' ? <ArrowDownward /> : null}
                        >
                            Publication Date
                        </Button>
                    </Stack>

                    <JobListTable jobs={currentJobs}/>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(totalItems / ITEMS_PER_PAGE)}
                        onPageChange={handlePageChange}
                        totalItems={totalItems} // Pass totalItems
                    />
                </>
            )}
            {jobs.length === 0 && !loading && !error && (
                    <Typography align="center">No jobs found. Please try a different search term.</Typography>
            )}
        </Container>
    );
};

export default Home;