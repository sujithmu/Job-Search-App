'use client';

import React from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { ArrowLeft, ArrowRight } from '@mui/icons-material';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number; // Add totalItems prop
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
}) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      mt={3}
    >
      <Button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        variant="outlined"
        startIcon={<ArrowLeft />}
      >
        Previous
      </Button>

      <Typography>
      {`Page ${currentPage} of ${totalPages} - Total Records: ${totalItems}`}
      </Typography>

      <Button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        variant="outlined"
        endIcon={<ArrowRight />}
      >
        Next
      </Button>
    </Stack>
  );
};

export default Pagination;