
  // Configuration for roles and storage key
  const config = {
    storageKey: 'teachingEmployees',
    roleMapping: {
      'Associate Professor': 'Senior Faculty',
      'Assistant Professor': 'Junior Faculty'
    },
    defaultRoleOptions: [
      { value: 'all', label: 'All Roles' },
      { value: 'senior_faculty', label: 'Senior Faculty' },
      { value: 'junior_faculty', label: 'Junior Faculty' }
    ]
  };

  // Get employees from localStorage
  function getEmployees() {
    try {
      return JSON.parse(localStorage.getItem(config.storageKey) || '[]');
    } catch (error) {
      console.error(`Error reading from ${config.storageKey}:`, error);
      return [];
    }
  }

  // Save employees to localStorage
  function saveEmployees(employees) {
    try {
      localStorage.setItem(config.storageKey, JSON.stringify(employees));
    } catch (error) {
      console.error(`Error saving to ${config.storageKey}:`, error);
    }
  }

  // Show loading spinner
  function showLoading() {
    document.getElementById('payrollTable').querySelector('tbody').innerHTML = '<tr><td colspan="8" class="text-center"><div class="loader"></div></td></tr>';
  }

  // Delete employee
  function deleteEmployee(id) {
    const employees = getEmployees();
    const updatedEmployees = employees.filter(emp => emp.id !== id);
    saveEmployees(updatedEmployees);
    const role = document.getElementById('roleFilter').value;
    const date = document.getElementById('dateFilter').value;
    fetchPayrollData(role, date);
    renderPayrollChart();
  }

  // Calculate payroll data from employee data
  function calculatePayrollData(employees, role = 'all', date = null) {
    let filteredEmployees = employees;

    // Filter by role
    if (role !== 'all') {
      filteredEmployees = employees.filter(emp => {
        const empRole = config.roleMapping[emp.designation];
        return empRole && empRole.toLowerCase().replace(' ', '_') === role;
      });
    }

    // Filter by date (employees hired on or before the selected month/year)
    if (date) {
      const [year, month] = date.split('-').map(Number);
      const filterDate = new Date(year, month, 0); // Last day of the selected month
      filteredEmployees = filteredEmployees.filter(emp => {
        const hireDate = new Date(emp.hireDate);
        return hireDate <= filterDate;
      });
    }

    // Filter by search input
    const searchInput = document.getElementById('searchInput');
    const search = searchInput ? searchInput.value.toLowerCase() : '';
    if (search) {
      filteredEmployees = filteredEmployees.filter(emp =>
        emp.name.toLowerCase().includes(search) || emp.id.toLowerCase().includes(search)
      );
    }

    // Calculate payroll details
    return filteredEmployees.map(emp => {
      const grossSalary = Number(emp.salary) || 0;
      const deductions = Math.round(grossSalary * 0.1); // Assume 10% deductions
      const netPay = grossSalary - deductions;
      const role = config.roleMapping[emp.designation] || 'Unknown';
      return {
        id: emp.id,
        name: emp.name,
        role,
        department: emp.department,
        designation: emp.designation,
        grossSalary,
        deductions,
        netPay,
        hireDate: emp.hireDate,
        profilePic: emp.profilePic || 'https://randomuser.me/api/portraits/lego/1.jpg'
      };
    });
  }

  // Calculate summary for chart
  function calculateSummary(payrollData) {
    const summary = {
      senior_faculty: 0,
      junior_faculty: 0
    };

    payrollData.forEach(item => {
      const roleKey = item.role.toLowerCase().replace(' ', '_');
      if (summary.hasOwnProperty(roleKey)) {
        summary[roleKey] += item.grossSalary;
      }
    });

    return summary;
  }

  // Fetch and update payroll data
  async function fetchPayrollData(role = 'all', date = null) {
    showLoading();
    try {
      const employees = getEmployees();
      const payrollData = calculatePayrollData(employees, role, date);

      // Render table
      const tbody = document.getElementById('payrollTable').querySelector('tbody');
      tbody.innerHTML = payrollData.length
        ? payrollData.map(item => `
            <tr>
              <td>${item.id}</td>
              <td><img src="${item.profilePic}" alt="Profile"></td>
              <td>${item.name}</td>
              <td>${item.department}</td>
              <td>${item.designation}</td>
              <td>₹${item.grossSalary.toLocaleString('en-IN')}</td>
              <td>${new Date(item.hireDate).toLocaleDateString('en-IN')}</td>
              <td>
                <span class="eye-icon" data-id="${item.id}"><i class="fas fa-eye"></i></span>
                <span class="remove-icon" data-id="${item.id}"><i class="fas fa-trash"></i></span>
              </td>
            </tr>
          `).join('')
        : '<tr><td colspan="8" class="text-center">No data available</td></tr>';

      // Add event listeners for view details
      document.querySelectorAll('.eye-icon').forEach(span => {
        span.addEventListener('click', () => {
          const id = span.getAttribute('data-id');
          const emp = payrollData.find(e => e.id === id);
          if (emp) {
            // Populate modal with employee details
            document.getElementById('modal-profile-pic').src = emp.profilePic;
            document.getElementById('modal-employee-id').textContent = emp.id;
            document.getElementById('modal-employee-name').textContent = emp.name;
            document.getElementById('modal-employee-role').textContent = emp.role;
            document.getElementById('modal-employee-department').textContent = emp.department;
            document.getElementById('modal-employee-designation').textContent = emp.designation;
            document.getElementById('modal-employee-gross-salary').textContent = `₹${emp.grossSalary.toLocaleString('en-IN')}`;
            document.getElementById('modal-employee-deductions').textContent = `₹${emp.deductions.toLocaleString('en-IN')}`;
            document.getElementById('modal-employee-net-pay').textContent = `₹${emp.netPay.toLocaleString('en-IN')}`;
            document.getElementById('modal-employee-hire-date').textContent = new Date(emp.hireDate).toLocaleDateString('en-IN');

            // Show the modal
            const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
            modal.show();
          }
        });
      });

      // Add event listeners for delete buttons
      document.querySelectorAll('.remove-icon').forEach(span => {
        span.addEventListener('click', () => {
          const id = span.getAttribute('data-id');
          const emp = employees.find(e => e.id === id);
          if (emp && confirm(`Are you sure you want to delete ${emp.name} (ID: ${emp.id})?`)) {
            deleteEmployee(id);
          }
        });
      });
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      document.getElementById('payrollTable').querySelector('tbody').innerHTML = '<tr><td colspan="8" class="text-center">Error loading data</td></tr>';
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

      const labels = ['Senior Faculty', 'Junior Faculty'];
      const data = [summaryData.senior_faculty, summaryData.junior_faculty];

      const canvas = document.getElementById('payrollChart');
      if (!canvas) {
        console.error('Payroll chart canvas not found');
        return;
      }

      payrollChart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Total Payroll (₹)',
            data,
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
  document.getElementById('exportCsv').addEventListener('click', async () => {
    try {
      const employees = getEmployees();
      const payrollData = calculatePayrollData(employees);

      const csv = [
        'Employee ID,Name,Role,Department,Designation,Gross Salary,Deductions,Net Pay,Hire Date',
        ...payrollData.map(item => `${item.id},${item.name},${item.role},${item.department},${item.designation},${item.grossSalary},${item.deductions},${item.netPay},${new Date(item.hireDate).toLocaleDateString('en-IN')}`)
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'teaching_payroll.csv';
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
    roleFilter.innerHTML = config.defaultRoleOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
  }

  // Initialize Flatpickr
  function initializeDatePicker() {
    flatpickr('#dateFilter', {
      dateFormat: 'Y-m',
      altInput: true,
      altFormat: 'F Y',
      mode: 'single',
      static: true,
      onChange: (selectedDates, dateStr) => {
        const role = document.getElementById('roleFilter').value;
        fetchPayrollData(role, dateStr);
      }
    });
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
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });

  // Close sidebar on outside click (mobile)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 991 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
      sidebar.classList.remove('active');
    }
  });

  // Filters and Search
  document.getElementById('searchInput')?.addEventListener('input', () => {
    const role = document.getElementById('roleFilter').value;
    const date = document.getElementById('dateFilter').value;
    fetchPayrollData(role, date);
  });

  document.getElementById('roleFilter').addEventListener('change', (e) => {
    const role = e.target.value;
    const date = document.getElementById('dateFilter').value;
    fetchPayrollData(role, date);
  });

  // Admin dropdown actions
  document.getElementById('profile-link').addEventListener('click', () => {
    alert('Navigating to Profile...');
  });
  document.getElementById('settings-link').addEventListener('click', () => {
    alert('Opening Settings...');
  });
  document.getElementById('logout-link').addEventListener('click', () => {
    alert('Logging out...');
  });

  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = document.getElementById('theme-toggle');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
  });

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    try {
      initializeRoleFilter();
      initializeDatePicker();
      fetchPayrollData();
      renderPayrollChart();
    } catch (error) {
      console.error('Initialization error:', error);
    }
  });
