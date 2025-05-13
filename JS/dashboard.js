
  // Helper function to get employees from localStorage
  function getEmployees(type) {
    try {
      const data = JSON.parse(localStorage.getItem(type) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Error reading ${type} from localStorage:`, error);
      return [];
    }
  }

  // Helper function to save employees to localStorage
  function saveEmployees(type, employees) {
    try {
      localStorage.setItem(type, JSON.stringify(employees));
    } catch (error) {
      console.error(`Error saving ${type} to localStorage:`, error);
    }
  }

  // Parse CSV or Excel file and import data
  function importFile(file) {
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (fileExt === 'csv') {
      Papa.parse(file, {
        complete: (result) => {
          try {
            const rows = result.data;
            if (rows.length < 1) {
              alert('Empty CSV file');
              return;
            }
            processRows(rows);
          } catch (error) {
            console.error('Error parsing CSV:', error);
            alert('Failed to import CSV. Please check the file format.');
          }
        },
        header: false,
        skipEmptyLines: true
      });
    } else if (fileExt === 'xlsx') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (rows.length < 1) {
            alert('Empty Excel file');
            return;
          }
          processRows(rows);
        } catch (error) {
          console.error('Error parsing Excel:', error);
          alert('Failed to import Excel. Please check the file format.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Please select a CSV or Excel file');
      return;
    }

    function processRows(rows) {
      const headers = rows[0].map(h => h.trim().toLowerCase());
      const requiredHeaders = ['id', 'name', 'department', 'salary', 'hiredate', 'type'];
      if (!requiredHeaders.every(h => headers.includes(h))) {
        alert('Invalid file format. Required headers: id, name, department, salary, hireDate, type');
        return;
      }

      const teachingEmployees = getEmployees('teachingEmployees');
      const nonTeachingEmployees = getEmployees('nonTeachingEmployees');
      const teachingIds = new Set(teachingEmployees.map(emp => emp.id));
      const nonTeachingIds = new Set(nonTeachingEmployees.map(emp => emp.id));

      const newTeaching = [];
      const newNonTeaching = [];

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        if (cols.length < headers.length) continue;

        const employee = {};
        headers.forEach((header, index) => {
          employee[header] = cols[index] ? cols[index].toString().trim() : '';
        });

        if (!employee.id || !employee.name || !employee.department || !employee.salary || !employee.hiredate || !employee.type) {
          console.warn(`Skipping invalid row ${i}:`, employee);
          continue;
        }

        if (isNaN(employee.salary) || Number(employee.salary) <= 0) {
          console.warn(`Invalid salary in row ${i}:`, employee.salary);
          continue;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(employee.hiredate)) {
          console.warn(`Invalid hireDate in row ${i}:`, employee.hiredate);
          continue;
        }

        const empData = {
          id: employee.id,
          name: employee.name,
          department: employee.department,
          salary: Number(employee.salary),
          hireDate: employee.hiredate,
          profilePic: employee.profilepic || ''
        };

        if (employee.type.toLowerCase() === 'teaching') {
          if (!teachingIds.has(empData.id)) {
            newTeaching.push(empData);
            teachingIds.add(empData.id);
          } else {
            const index = teachingEmployees.findIndex(emp => emp.id === empData.id);
            teachingEmployees[index] = empData;
          }
        } else if (employee.type.toLowerCase() === 'nonteaching') {
          if (!nonTeachingIds.has(empData.id)) {
            newNonTeaching.push(empData);
            nonTeachingIds.add(empData.id);
          } else {
            const index = nonTeachingEmployees.findIndex(emp => emp.id === empData.id);
            nonTeachingEmployees[index] = empData;
          }
        }
      }

      saveEmployees('teachingEmployees', [...teachingEmployees, ...newTeaching]);
      saveEmployees('nonTeachingEmployees', [...nonTeachingEmployees, ...newNonTeaching]);

      fetchDashboardData();
      renderCharts(null);
      alert('Data imported successfully');
    }
  }

  // Helper function to calculate salary trend for last 5 months
  function calculateSalaryTrend(teachingEmployees, nonTeachingEmployees, filterMonth = null) {
    const months = [];
    const teachingSalaries = [];
    const nonTeachingSalaries = [];
    const today = filterMonth ? new Date(filterMonth + '-01') : new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    for (let i = 4; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthStr = date.toLocaleString('en-US', { month: 'short' });
      const yearStr = date.getFullYear().toString().slice(-2);
      months.push(`${monthStr}, ${yearStr}`);

      // Calculate total salaries for employees hired on or before the month
      const teachingTotal = teachingEmployees.reduce((sum, emp) => {
        const hireDate = new Date(emp.hireDate);
        if (hireDate <= date) return sum + (Number(emp.salary) || 0);
        return sum;
      }, 0);

      const nonTeachingTotal = nonTeachingEmployees.reduce((sum, emp) => {
        const hireDate = new Date(emp.hireDate);
        if (hireDate <= date) return sum + (Number(emp.salary) || 0);
        return sum;
      }, 0);

      teachingSalaries.push(teachingTotal);
      nonTeachingSalaries.push(nonTeachingTotal);
    }

    return { months, teachingSalaries, nonTeachingSalaries };
  }

  function showLoading() {
    document.querySelectorAll('.card-body h4, .card-body h5').forEach(el => {
      el.innerHTML = '<div class="loader"></div>';
    });
  }

  async function fetchDashboardData() {
    showLoading();
    try {
      const teachingEmployees = getEmployees('teachingEmployees');
      const nonTeachingEmployees = getEmployees('nonTeachingEmployees');

      // Staff counts
      const staffData = {
        teaching: teachingEmployees.length,
        nonTeaching: nonTeachingEmployees.length
      };
      document.getElementById('teaching-count').textContent = staffData.teaching;
      document.getElementById('non-teaching-count').textContent = staffData.nonTeaching;

      // Current and last month salaries
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);

      const currentSalary = teachingEmployees.reduce((sum, emp) => {
        const hireDate = new Date(emp.hireDate);
        return hireDate <= today ? sum + (Number(emp.salary) || 0) : sum;
      }, 0) + nonTeachingEmployees.reduce((sum, emp) => {
        const hireDate = new Date(emp.hireDate);
        return hireDate <= today ? sum + (Number(emp.salary) || 0) : sum;
      }, 0);

      const lastSalary = teachingEmployees.reduce((sum, emp) => {
        const hireDate = new Date(emp.hireDate);
        return hireDate <= lastMonthDate ? sum + (Number(emp.salary) || 0) : sum;
      }, 0) + nonTeachingEmployees.reduce((sum, emp) => {
        const hireDate = new Date(emp.hireDate);
        return hireDate <= lastMonthDate ? sum + (Number(emp.salary) || 0) : sum;
      }, 0);

      document.getElementById('current-salary').textContent = currentSalary ? `₹ ${currentSalary.toLocaleString('en-IN')}` : '₹ 0';
      document.getElementById('last-salary').textContent = lastSalary ? `₹ ${lastSalary.toLocaleString('en-IN')}` : '₹ 0';
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      document.querySelectorAll('.card-body h4, .card-body h5').forEach(el => {
        el.textContent = 'Error loading data';
      });
    }
  }

  let pieChart, barChart;
  async function renderCharts(filterMonth = null) {
    try {
      const pieCanvas = document.getElementById('staffPieChart');
      const barCanvas = document.getElementById('salaryBarChart');
      if (!pieCanvas || !barCanvas) {
        console.error('Canvas elements not found:', { pieCanvas, barCanvas });
        return;
      }

      const teachingEmployees = getEmployees('teachingEmployees');
      const nonTeachingEmployees = getEmployees('nonTeachingEmployees');
      const trendData = calculateSalaryTrend(teachingEmployees, nonTeachingEmployees, filterMonth);
      const staffData = {
        teaching: teachingEmployees.length,
        nonTeaching: nonTeachingEmployees.length
      };

      const rootStyles = getComputedStyle(document.documentElement);
      const primaryColor = rootStyles.getPropertyValue('--primary-color').trim();
      const secondaryColor = rootStyles.getPropertyValue('--secondary-color').trim();

      if (pieChart && typeof pieChart.destroy === 'function') {
        pieChart.destroy();
      }
      if (barChart && typeof barChart.destroy === 'function') {
        barChart.destroy();
      }

      pieChart = new Chart(pieCanvas, {
        type: 'pie',
        data: {
          labels: ['Teaching Staff', 'Non-Teaching Staff'],
          datasets: [{
            data: [staffData.teaching, staffData.nonTeaching],
            backgroundColor: [primaryColor, secondaryColor]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: { enabled: true }
          },
          animation: {
            animateScale: true,
            animateRotate: true
          }
        }
      });

      barChart = new Chart(barCanvas, {
        type: 'bar',
        data: {
          labels: trendData.months || [],
          datasets: [
            {
              label: 'Teaching Staff',
              data: trendData.teachingSalaries || [],
              backgroundColor: primaryColor
            },
            {
              label: 'Non-Teaching Staff',
              data: trendData.nonTeachingSalaries || [],
              backgroundColor: secondaryColor
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: { 
              beginAtZero: true, 
              title: { display: true, text: 'Salary (₹)' },
              ticks: {
                callback: function(value) {
                  return '₹' + value.toLocaleString('en-IN');
                }
              }
            }
          },
          plugins: {
            tooltip: { 
              enabled: true,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  label += '₹' + (context.parsed.y || 0).toLocaleString('en-IN');
                  return label;
                }
              }
            }
          },
          animation: {
            duration: 1000,
            easing: 'easeInOutQuad'
          }
        }
      });
    } catch (error) {
      console.error('Error rendering charts:', error);
    }
  }

  // Initialize Flatpickr
  function initializeDatePicker() {
    flatpickr('#chartFilter', {
      dateFormat: 'Y-m',
      altInput: true,
      altFormat: 'F Y',
      mode: 'single',
      static: true,
      onChange: (selectedDates, dateStr) => {
        renderCharts(dateStr);
      }
    });
  }

  // File import event listener
  document.getElementById('file-import').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.match(/\.(csv|xlsx)$/)) {
      alert('Please select a CSV or Excel file');
      e.target.value = '';
      return;
    }
    document.querySelector('.import-loader').style.display = 'block';
    importFile(file);
    e.target.value = '';
    setTimeout(() => {
      document.querySelector('.import-loader').style.display = 'none';
    }, 1000);
  });

  document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', (e) => {
      if (!link.getAttribute('data-bs-toggle')) {
        document.querySelector('.sidebar a.active')?.classList.remove('active');
        link.classList.add('active');
      }
    });
  });

  const menuToggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 991 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
      sidebar.classList.remove('active');
    }
  });

  document.getElementById('profile-link').addEventListener('click', () => {
    alert('Navigating to Profile...');
  });
  document.getElementById('settings-link').addEventListener('click', () => {
    alert('Opening Settings...');
  });
  document.getElementById('logout-link').addEventListener('click', () => {
    alert('Logging out...');
  });

  document.querySelectorAll('.card[data-type]').forEach(card => {
    card.addEventListener('click', () => {
      const type = card.getAttribute('data-type');
      window.location.href = `${type}staff.html`;
    });
  });

  document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = document.getElementById('theme-toggle');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
  });

  document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
    renderCharts();
    initializeDatePicker();
  });
