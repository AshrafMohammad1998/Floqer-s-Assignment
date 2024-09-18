import React, { useEffect, useState } from 'react';
import './App.css'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

function App() {

  const [salaryData, setSalaryData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [selectedYear, setSelectedYear] = useState(null);
  const [jobTitleData, setJobTitleData] = useState([]);

  console.log(salaryData)

  useEffect(() => {
    fetch('/salaries.csv')
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          complete: (result) => {
            const groupedData = processSalaryData(result.data);
            setTableData(groupedData);
            setSalaryData(result.data);
          },
          error: (error) => console.error('Error parsing the CSV data:', error),
        });
      })
      .catch((error) => console.error('Error fetching the CSV file:', error));
  }, [])

  const processSalaryData = (data) => {
    const grouped = data.reduce((acc, row) => {
      const year = parseInt(row.work_year);
      const salaryUSD = parseFloat(row.salary_in_usd);

      if (!year || year < 2020 || year > 2024 || isNaN(salaryUSD)) {
        return acc;
      }

      if (!acc[year]) {
        acc[year] = { totalJobs: 0, totalSalary: 0 };
      }

      acc[year].totalJobs += 1;
      acc[year].totalSalary += salaryUSD;

      return acc;
    }, {});

    return Object.entries(grouped).map(([year, info]) => ({
      year: year,
      totalJobs: info.totalJobs,
      averageSalary: (info.totalSalary / info.totalJobs).toFixed(2),
    }));
  };

  const sortTable = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }

    const sortedData = [...tableData].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === 'ascending' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    setSortConfig({ key, direction });
    setTableData(sortedData);
  };

  const handleRowClick = (year) => {
    setSelectedYear(year);
    const jobTitleGrouped = salaryData
      .filter((row) => row.work_year === year)
      .reduce((acc, row) => {
        const jobTitle = row.job_title;
        if (!acc[jobTitle]) {
          acc[jobTitle] = 0;
        }
        acc[jobTitle] += 1;
        return acc;
      }, {});

    const jobTitleArray = Object.entries(jobTitleGrouped).map(([jobTitle, count]) => ({
      jobTitle,
      count,
    }));

    setJobTitleData(jobTitleArray);
  };

  return (
    <div className='bg-green-100 h-screen overflow-auto py-3'>
      <h1 className='text-center font-bold text-xl underline'>Machine Learning Engineer Salaries (2020-2024)</h1>

      <div className='w-4/5 bg-white p-8 rounded shadow-lg mt-5 m-auto'>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={tableData}
            margin={{
              top: 20, right: 30, left: 20, bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="year"
              tick={{ fill: '#4a5568', fontSize: 12 }}
              stroke="#4a5568"
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#4a5568', fontSize: 12 }}
              stroke="#4a5568"
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}
              labelStyle={{ color: '#4a5568' }}
              itemStyle={{ color: '#2d3748' }}
            />
            <Legend
              wrapperStyle={{ color: '#4a5568', fontSize: '14px' }}
            />
            <Line
              type="monotone"
              dataKey="totalJobs"
              stroke="#38bdf8"
              strokeWidth={3}
              activeDot={{ r: 10, fill: '#38bdf8', stroke: '#e0f2fe', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className='w-4/5 bg-white p-8 rounded shadow-lg mt-5 m-auto'>
        <table className='table-auto w-full border-collapse border border-gray-300'>
          <thead>
            <tr className='bg-gray-100'>
              <th className='border border-gray-300 px-4 py-2 cursor-pointer' onClick={() => sortTable('year')}>Year</th>
              <th className='border border-gray-300 px-4 py-2 cursor-pointer' onClick={() => sortTable('totalJobs')}>Number of Jobs</th>
              <th className='border border-gray-300 px-4 py-2 cursor-pointer' onClick={() => sortTable('averageSalary')}>Average Salary (USD)</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={index} className='hover:bg-gray-100 cursor-pointer' onClick={() => handleRowClick(row.year)}>
                <td className='border border-gray-300 px-4 py-2 text-center'>{row.year}</td>
                <td className='border border-gray-300 px-4 py-2 text-center'>{row.totalJobs}</td>
                <td className='border border-gray-300 px-4 py-2 text-center'>{row.averageSalary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedYear ? (
        <div className='w-4/5 bg-white p-8 rounded shadow-lg mt-5 m-auto'>
          <h2 className='text-center font-bold text-lg mb-4'>Job Titles in {selectedYear}</h2>
          <table className='table-auto w-full border-collapse border border-gray-300'>
            <thead>
              <tr className='bg-gray-100'>
                <th className='border border-gray-300 px-4 py-2'>Job Title</th>
                <th className='border border-gray-300 px-4 py-2'>Number of Jobs</th>
              </tr>
            </thead>
            <tbody>
              {jobTitleData.map((row, index) => (
                <tr key={index} className='hover:bg-gray-100'>
                  <td className='border border-gray-300 px-4 py-2'>{row.jobTitle}</td>
                  <td className='border border-gray-300 px-4 py-2 text-center'>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className='w-4/5 bg-white p-8 rounded shadow-lg mt-5 m-auto'>
          <p className='text-center text-gray-500'>Please select a year from the table above to view job titles and details.</p>
        </div>
      )}

    </div>
  )
}

export default App
