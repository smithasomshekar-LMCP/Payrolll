
  // Configuration for roles and storage key
  const config = {
    storageKey: 'nonTeachingEmployees',
    roleMapping: {
      'Admin': 'Administrative',
      'Accounts': 'Administrative',
      'Maintenance': 'Support Staff',
      'Clerk': 'Administrative',
      'Peon': 'Support Staff',
      'Cleaner': 'Support Staff'
    },
    defaultRoleOptions: [
      { value: 'all', label: 'All Roles' },
      { value: 'administrative', label: 'Administrative' },
      { value: 'support_staff', label: 'Support Staff' }
    ]
  };

  // Utility to safely parse dates
  function safeParseDate(dateStr) {
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.warn(`Invalid date format: ${dateStr}`);
      return null;
    }
  }

  // Get employees from localStorage
  function getEmployees() {
    try {
      const data = localStorage.getItem(config.storageKey);
      if (!data) {
        console.warn(`No data found in localStorage for ${config.storageKey}`);
        return [];
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        console.warn(`Data in ${config.storageKey} is not an array`);
        return [];
      }
      return parsed;
    } catch (error) {
      console.error(`Error parsing ${config.storageKey} from localStorage:`, error);
      return [];
    }
  }

  // Save employees to localStorage
  function saveEmployees(employees) {
    try {
      if (!Array.isArray(employees)) {
        console.warn('Attempted to save invalid employee data:', employees);
        return;
      }
      localStorage.setItem(config.storageKey, JSON.stringify(employees));
    } catch (error) {
      console.error(`Error saving to ${config.storageKey}:`, error);
    }
  }

  // Show loading spinner
  function showLoading() {
    const tbody = document.querySelector('#payrollTable tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center"><div class="loader"></div></td></tr>';
    } else {
      console.error('Payroll table body not found');
    }
  }

  // Delete employee
  function deleteEmployee(id) {
    try {
      const employees = getEmployees();
      const updatedEmployees = employees.filter(emp => emp.id !== id);
      saveEmployees(updatedEmployees);
      const role = document.getElementById('roleFilter')?.value || 'all';
      const date = document.getElementById('dateFilter')?.value || null;
      fetchPayrollData(role, date);
      renderPayrollChart();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee');
    }
  }

  // Calculate payroll data from employee data
  function calculatePayrollData(employees, role = 'all', date = null) {
    try {
      // Validate and filter employees
      let filteredEmployees = employees.filter(emp => {
        if (!emp || typeof emp !== 'object') {
          console.warn('Invalid employee object:', emp);
          return false;
        }
        if (!emp.id || !emp.name) {
          console.warn(`Missing required fields (id or name) in employee:`, emp);
          return false;
        }
        return true;
      });

      // Filter by role
      if (role !== 'all') {
        filteredEmployees = filteredEmployees.filter(emp => {
          const empRole = config.roleMapping[emp.designation] || config.roleMapping[emp.department] || '';
          const normalizedRole = empRole.toLowerCase().replace(' ', '_');
          if (!empRole) {
            console.warn(`No role mapping for employee: ${emp.id}, designation: ${emp.designation}, department: ${emp.department}`);
          }
          return normalizedRole === role;
        });
      }

      // Filter by date
      if (date) {
        const [year, month] = date.split('-').map(Number);
        if (isNaN(year) || isNaN(month)) {
          console.warn(`Invalid date format: ${date}`);
          return filteredEmployees;
        }
        const filterDate = new Date(year, month - 1, 0); // Last day of previous month
        filteredEmployees = filteredEmployees.filter(emp => {
          const hireDate = safeParseDate(emp.hireDate);
          if (!hireDate) {
            console.warn(`Invalid hireDate for employee ${emp.id}: ${emp.hireDate}`);
            return false;
          }
          return hireDate <= filterDate;
        });
      }

      // Filter by search input
      const searchInput = document.getElementById('searchInput');
      const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
      if (search) {
        filteredEmployees = filteredEmployees.filter(emp =>
          (emp.name || '').toLowerCase().includes(search) ||
          (emp.id || '').toLowerCase().includes(search)
        );
      }

      // Calculate payroll details
      return filteredEmployees.map(emp => {
        const grossSalary = Number(emp.salary) || 0;
        const deductions = Math.round(grossSalary * 0.1);
        const netPay = grossSalary - deductions;
        const role = config.roleMapping[emp.designation] || config.roleMapping[emp.department] || 'Unknown';
        return {
          id: emp.id,
          name: emp.name,
          role,
          department: emp.department || 'N/A',
          designation: emp.designation || 'N/A',
          grossSalary,
          deductions,
          netPay,
          hireDate: emp.hireDate || null,
          profilePic: emp.profilePic || 'https://randomuser.me/api/portraits/lego/1.jpg'
        };
      });
    } catch (error) {
      console.error('Error in calculatePayrollData:', error);
      return [];
    }
  }

  // Calculate summary for chart
  function calculateSummary(payrollData) {
    const summary = {
      administrative: 0,
      support_staff: 0
    };
    try {
      payrollData.forEach(item => {
        const roleKey = item.role.toLowerCase().replace(' ', '_');
        if (summary.hasOwnProperty(roleKey)) {
          summary[roleKey] += item.grossSalary;
        }
      });
    } catch (error) {
      console.error('Error in calculateSummary:', error);
    }
    return summary;
  }

  // Fetch and update payroll data
  async function fetchPayrollData(role = 'all', date = null) {
    showLoading();
    try {
      const employees = getEmployees();
      if (!employees.length) {
        console.warn('No employees found in localStorage');
        const tbody = document.querySelector('#payrollTable tbody');
        if (tbody) {
          tbody.innerHTML = '<tr><td colspan="8" class="text-center">No data available</td></tr>';
        }
        return;
      }

      const payrollData = calculatePayrollData(employees, role, date);

      // Render table
      const tbody = document.querySelector('#payrollTable tbody');
      if (!tbody) {
        console.error('Payroll table body not found');
        return;
      }

      tbody.innerHTML = payrollData.length
        ? payrollData.map(item => {
            const hireDateStr = item.hireDate ? safeParseDate(item.hireDate)?.toLocaleDateString('en-IN') || 'N/A' : 'N/A';
            return `
              <tr>
                <td>${item.id}</td>
                <td><img src="${item.profilePic}" alt="Profile"></td>
                <td>${item.name}</td>
                <td>${item.department}</td>
                <td>${item.designation}</td>
                <td>₹${item.grossSalary.toLocaleString('en-IN')}</td>
                <td>${hireDateStr}</td>
                <td>
                  <span class="eye-icon" data-id="${item.id}"><i class="fas fa-eye"></i></span>
                  <span class="remove-icon" data-id="${item.id}"><i class="fas fa-trash"></i></span>
                </td>
              </tr>
            `;
          }).join('')
        : '<tr><td colspan="8" class="text-center">No data available</td></tr>';

      // Add event listeners for view details
      document.querySelectorAll('.eye-icon').forEach(span => {
        span.addEventListener('click', () => {
          const id = span.getAttribute('data-id');
          const emp = payrollData.find(e => e.id === id);
          if (!emp) {
            console.warn(`Employee not found for ID: ${id}`);
            return;
          }
          try {
            document.getElementById('modal-profile-pic').src = emp.profilePic;
            document.getElementById('modal-employee-id').textContent = emp.id;
            document.getElementById('modal-employee-name').textContent = emp.name;
            document.getElementById('modal-employee-role').textContent = emp.role;
            document.getElementById('modal-employee-department').textContent = emp.department;
            document.getElementById('modal-employee-designation').textContent = emp.designation;
            document.getElementById('modal-employee-gross-salary').textContent = `₹${emp.grossSalary.toLocaleString('en-IN')}`;
            document.getElementById('modal-employee-deductions').textContent = `₹${emp.deductions.toLocaleString('en-IN')}`;
            document.getElementById('modal-employee-net-pay').textContent = `₹${emp.netPay.toLocaleString('en-IN')}`;
            document.getElementById('modal-employee-hire-date').textContent = emp.hireDate ? safeParseDate(emp.hireDate)?.toLocaleDateString('en-IN') || 'N/A' : 'N/A';

            const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
            modal.show();
          } catch (error) {
            console.error('Error displaying employee modal:', error);
          }
        });
      });

      // Add event listeners for delete buttons
      document.querySelectorAll('.remove-icon').forEach(span => {
        span.addEventListener('click', () => {
          const id = span.getAttribute('data-id');
          const emp = employees.find(e => e.id === id);
          if (!emp) {
            console.warn(`Employee not found for deletion, ID: ${id}`);
            return;
          }
          if (confirm(`Are you sure you want to delete ${emp.name} (ID: ${emp.id})?`)) {
            deleteEmployee(id);
          }
        });
      });
    } catch (error) {
      console.error('Error in fetchPayrollData:', error);
      const tbody = document.querySelector('#payrollTable tbody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Error loading data</td></tr>';
      }
    }
  }

  // Render payroll summary chart
  let payrollChart;
  async function renderPayrollChart() {
    try {
      const employees = getEmployees();
      const payrollData = calculatePayrollData(employees);
      const summaryData = calculateSummary(payrollData);

      const rootStyles = getComputedStyle(document.documentElement);
      const primaryColor = rootStyles.getPropertyValue('--primary-color').trim();
      const secondaryColor = rootStyles.getPropertyValue('--secondary-color').trim();

      if (payrollChart && typeof payrollChart.destroy === 'function') {
        payrollChart.destroy();
      }

      const canvas = document.getElementById('payrollChart');
      if (!canvas) {
        console.error('Payroll chart canvas not found');
        return;
      }

      payrollChart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: ['Administrative', 'Support Staff'],
          datasets: [{
            label: 'Total Payroll (₹)',
            data: [summaryData.administrative, summaryData.support_staff],
            backgroundColor: [primaryColor, secondaryColor]
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Amount (₹)' },
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
      console.error('Error rendering chart:', error);
    }
  }

  // Export to CSV
  document.getElementById('exportCsv')?.addEventListener('click', async () => {
    try {
      const employees = getEmployees();
      const payrollData = calculatePayrollData(employees);

      const csv = [
        'Employee ID,Name,Role,Department,Designation,Gross Salary,Deductions,Net Pay,Hire Date',
        ...payrollData.map(item => {
          const hireDateStr = item.hireDate ? safeParseDate(item.hireDate)?.toLocaleDateString('en-IN') || 'N/A' : 'N/A';
          return `${item.id},${item.name},${item.role},${item.department},${item.designation},${item.grossSalary},${item.deductions},${item.netPay},${hireDateStr}`;
        })
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nonteaching_payroll.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV');
    }
  });

  // Initialize role filter dropdown
  function initializeRoleFilter() {
    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
      roleFilter.innerHTML = config.defaultRoleOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
    } else {
      console.error('Role filter element not found');
    }
  }

  // Initialize Flatpickr
  function initializeDatePicker() {
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
      flatpickr('#dateFilter', {
        dateFormat: 'Y-m',
        altInput: true,
        altFormat: 'F Y',
        mode: 'single',
        static: true,
        onChange: (selectedDates, dateStr) => {
          const role = document.getElementById('roleFilter')?.value || 'all';
          fetchPayrollData(role, dateStr);
        }
      });
    } else {
      console.error('Date filter element not found');
    }
  }

  // Sidebar navigation
  document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', (e) => {
      if (!link.getAttribute('data-bs-toggle')) {
        document.querySelectorAll('.sidebar a.active').forEach(activeLink => activeLink.classList.remove('active'));
        link.classList.add('active');
        if (link.parentElement.classList.contains('collapse')) {
          link.closest('.nav-item').querySelector('a[data-bs-toggle="collapse"]').classList.add('active');
        }
      }
    });
  });

  // Menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }

  // Close sidebar on outside click (mobile)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 991 && sidebar && menuToggle && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
      sidebar.classList.remove('active');
    }
  });

  // Filters and Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const role = document.getElementById('roleFilter')?.value || 'all';
      const date = document.getElementById('dateFilter')?.value || null;
      fetchPayrollData(role, date);
    });
  }

  const roleFilter = document.getElementById('roleFilter');
  if (roleFilter) {
    roleFilter.addEventListener('change', (e) => {
      const role = e.target.value;
      const date = document.getElementById('dateFilter')?.value || null;
      fetchPayrollData(role, date);
    });
  }

  // Admin dropdown actions
  document.getElementById('profile-link')?.addEventListener('click', () => {
    alert('Navigating to Profile...');
  });
  document.getElementById('settings-link')?.addEventListener('click', () => {
    alert('Opening Settings...');
  });
  document.getElementById('logout-link')?.addEventListener('click', () => {
    alert('Logging out...');
  });

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      themeToggle.classList.toggle('fa-moon');
      themeToggle.classList.toggle('fa-sun');
    });
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    try {
      initializeRoleFilter();
      initializeDatePicker();
      fetchPayrollData();
      renderPayrollChart();
    } catch (error) {
      console.error('Initialization error:', error);
      const tbody = document.querySelector('#payrollTable tbody');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Error initializing application</td></tr>';
      }
    }
  });
