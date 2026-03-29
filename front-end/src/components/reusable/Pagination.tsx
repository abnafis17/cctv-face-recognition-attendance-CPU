'use client';

import clsx from 'clsx';
import { useEffect, useState } from 'react';

interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  numberOfData: number;
  limits: number;
  getCurrentPage?: (page: number) => void;
  searchText?: string;
  activeTab?: string;
  activeTab2?: string;
}

export default function Pagination({
  numberOfData,
  limits,
  className,
  getCurrentPage,
  searchText,
  activeTab,
  activeTab2,
  ...props
}: PaginationProps) {
  const [numberOfPage, setNumberOfPage] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    if (numberOfData < limits) {
      setNumberOfPage(1);
    } else {
      setNumberOfPage(Math.ceil(numberOfData / limits));
    }
  }, [numberOfData, limits]);

  // Reset page to 1 when searchText changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
      getCurrentPage?.(1);
    }
  }, [searchText, activeTab, activeTab2]);

  const setLimitHandler = (index: number) => {
    const newPage = index + 1;
    setCurrentPage(newPage);
    getCurrentPage?.(newPage);
  };

  const getDisplayedPages = (): number[] => {
    const maxButtonsToShow = 5;
    let pages: number[] = [];

    if (numberOfPage <= maxButtonsToShow) {
      for (let i = 1; i <= numberOfPage; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 5) {
        pages = [1, 2, 3, 4, 5];
      } else if (currentPage > numberOfPage - 4) {
        pages = [
          numberOfPage - 4,
          numberOfPage - 3,
          numberOfPage - 2,
          numberOfPage - 1,
          numberOfPage,
        ];
      } else {
        pages = [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
      }
    }

    return pages;
  };

  return (
    <div {...props} className={clsx('flex justify-start', className)}>
      <div className="flex flex-wrap gap-y-1 items-center space-x-2">
        {/* Prev Button */}
        <button
          disabled={currentPage === 1}
          onClick={() => setLimitHandler(currentPage - 2)}
          className={clsx(
            'border cursor-pointer hover:border-gray-300 transition-all ease-in-out bg-white px-3 py-2 gap-2 flex justify-center items-center rounded-md',
            currentPage === 1 && 'opacity-50'
          )}
        >
          <svg width="14" height="13" viewBox="0 0 17 16" fill="none">
            <g clipPath="url(#clip0)">
              <path d="M16 8.5H1" stroke="#051B44" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M6 3.5L1 8.5L6 13.5"
                stroke="#051B44"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0">
                <rect width="16" height="16" fill="white" transform="translate(0.5)" />
              </clipPath>
            </defs>
          </svg>
          <p className="font-medium text-xs lg:text-sm text-black">Prev</p>
        </button>

        {/* First + Dots */}
        {currentPage > 5 && numberOfPage > 5 && (
          <>
            <button
              onClick={() => setLimitHandler(0)}
              className={clsx(
                'border cursor-pointer h-8 w-8 flex justify-center items-center rounded-md text-xs lg:text-sm font-medium',
                currentPage === 1 ? 'bg-primary text-white' : 'bg-white text-black'
              )}
            >
              1
            </button>
            <span className="border h-8 w-8 flex justify-center items-center rounded-md text-xs lg:text-sm font-medium bg-white text-black">
              ...
            </span>
          </>
        )}

        {/* Page Buttons */}
        {getDisplayedPages().map((each) => (
          <button
            key={each}
            onClick={() => setLimitHandler(each - 1)}
            className={clsx(
              'border h-8 w-8 flex cursor-pointer justify-center items-center rounded-md text-xs lg:text-sm font-medium',
              currentPage === each ? 'bg-blue-100 text-gray-700' : 'bg-white text-black'
            )}
          >
            {each}
          </button>
        ))}

        {/* Dots + Last */}
        {currentPage <= numberOfPage - 5 && numberOfPage > 5 && (
          <>
            <span className="border h-8 w-8 flex justify-center items-center rounded-md text-xs lg:text-sm font-medium bg-white text-black">
              ...
            </span>
            <button
              onClick={() => setLimitHandler(numberOfPage - 1)}
              className={clsx(
                'border h-8 w-8 flex justify-center items-center rounded-md text-xs lg:text-sm font-medium',
                currentPage === numberOfPage ? 'bg-primary text-white' : 'bg-white text-black'
              )}
            >
              {numberOfPage}
            </button>
          </>
        )}

        {/* Next Button */}
        <button
          disabled={numberOfPage <= 1 || numberOfPage === currentPage}
          onClick={() => setLimitHandler(currentPage)}
          className={clsx(
            'border cursor-pointer hover:border-gray-300 transition-all ease-in-out bg-white px-4 py-2 gap-2 flex justify-center items-center rounded-md text-xs lg:text-sm',
            (numberOfPage <= 1 || numberOfPage === currentPage) && 'opacity-50'
          )}
        >
          <p className="font-medium text-xs lg:text-sm text-black">Next</p>
          <svg width="14" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M0.5 8.5H15.5" stroke="#051B44" strokeLinecap="round" strokeLinejoin="round" />
            <path
              d="M10.5 3.5L15.5 8.5L10.5 13.5"
              stroke="#051B44"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
