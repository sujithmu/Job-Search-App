'use client'; // Mark this component as a client component

import React, { useState } from 'react';
import { TextField, Button, Box, IconButton, InputAdornment } from '@mui/material';
import { Clear } from '@mui/icons-material';

interface JobSearchFormProps {
    onSearch: (query: string) => void;
}

const JobSearchForm: React.FC<JobSearchFormProps> = ({ onSearch }) => {
    const [query, setQuery] = useState<string>('');
    // const { t } = useTranslation();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(event.target.value);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        onSearch(query);
    };
    const handleClear = () => {
        setQuery('');
        onSearch(''); // Optionally, trigger a search with an empty query
    };
    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
                //label="Search Jobs"
                variant="outlined"
                fullWidth
                value={query}
                onChange={handleChange}
                placeholder="Search for Frontend or Göteborg or Volvo"
                slotProps={{
                    input: {
                    endAdornment: (
                        <InputAdornment position="end">
                        {query && (
                            <IconButton
                            aria-label="clear search"
                            onClick={handleClear}
                            edge="end"
                            >
                            <Clear />
                            </IconButton>
                        )}
                        </InputAdornment>
                    ),
                    },
                }}
            />
            <Button variant="contained" color="primary" type="submit">
                Search
            </Button>
        </Box>
    );
};

export default JobSearchForm;