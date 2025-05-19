const config = {
  storageKey: 'nonTeachingEmployees',
  roleMapping: {
    'Clerk': 'Administrative',
    'Peon': 'Support Staff',
    'Cleaner': 'Support Staff'
  },
  defaultRoleOptions: [
    { value: 'all', label: 'All Roles' },
    { value: 'administrative', label: 'Administrative' },
    { value: 'support_staff', label: 'Support Staff' }
  ],
  departments: ['Admin', 'Accounts', 'Maintenance'],
  designations: ['Clerk', 'Peon', 'Cleaner']
};

let employees = [];

function initializeStorage() {
  try {
    if (!localStorage.getItem(config.storageKey)) {
      localStorage.setItem(config.storageKey, JSON.stringify([]));
    }
    employees = JSON.parse(localStorage.getItem(config.storageKey) || '[]');
  } catch (error) {
    console.error('Error initializing localStorage:', error);
    employees = [];
  }
}

function saveEmployees() {
  try {
    localStorage.setItem(config.storageKey, JSON.stringify(employees));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

function initializeDropdowns() {
  const departmentFilter = document.getElementById('departmentFilter');
  const designationFilter = document.getElementById('designationFilter');
  const employeeDepartment = document.getElementById('employeeDepartment');
  const employeeDesignation = document.getElementById('employeeDesignation');
  const yearFilter = document.getElementById('yearFilter');

  if (departmentFilter) {
    departmentFilter.innerHTML = '<option value="">All Departments</option>' + 
      config.departments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
  } else {
    console.warn('departmentFilter element not found');
  }

  if (designationFilter) {
    designationFilter.innerHTML = '<option value="">All Designations</option>' + 
      config.designations.map(design => `<option value="${design}">${design}</option>`).join('');
  } else {
    console.warn('designationFilter element not found');
  }

  if (employeeDepartment) {
    employeeDepartment.innerHTML = config.departments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
  } else {
    console.warn('employeeDepartment element not found');
  }

  if (employeeDesignation) {
    employeeDesignation.innerHTML = config.designations.map(design => `<option value="${design}">${design}</option>`).join('');
  } else {
    console.warn('employeeDesignation element not found');
  }

  if (yearFilter) {
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 10}, (_, i) => currentYear - i);
    yearFilter.innerHTML = '<option value="">All Years</option>' + 
      years.map(year => `<option value="${year}">${year}</option>`).join('');
  } else {
    console.warn('yearFilter element not found');
  }
}

function initializeRoleFilter() {
  const roleFilter = document.getElementById('roleFilter');
  if (roleFilter) {
    roleFilter.innerHTML = config.defaultRoleOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
  } else {
    console.warn('roleFilter element not found');
  }
}
/*
function generateEmployeeId() {
  const nonTeaching = JSON.parse(localStorage.getItem(config.storageKey) || '[]');
  const maxId = nonTeaching.length > 0 ? Math.max(...nonTeaching.map(emp => parseInt(emp.id.replace('EMP', '')))) : 0;
  return `EMP${String(maxId + 1).padStart(3, '0')}`;
}

*/

function generateEmployeeId(categoryKey = 'teachingEmployees', prefix = 'EMP') {
  // Get the employee list from localStorage
  const employees = JSON.parse(localStorage.getItem(categoryKey) || '[]');
 
  // Find the highest numeric ID currently used
  const maxId = employees.length > 0
    ? Math.max(...employees.map(emp => parseInt(emp.id.replace(prefix, '')) || 0))
    : 0;
 
  // Return new ID with prefix and zero-padding (e.g., EMP001)
  return `${prefix}${String(maxId + 1).padStart(3, '0')}`;
}

function initializeSidebar() {
  const menuToggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 991 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        sidebar.classList.remove('active');
      }
    });
  }

  document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', (e) => {
      if (!link.getAttribute('data-bs-toggle')) {
        document.querySelector('.sidebar a.active')?.classList.remove('active');
        link.classList.add('active');
      }
    });
  });
}

function filterEmployees() {
  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const department = document.getElementById('departmentFilter')?.value || '';
  const designation = document.getElementById('designationFilter')?.value || '';
  const role = document.getElementById('roleFilter')?.value || 'all';
  const month = document.getElementById('monthFilter')?.value || '';
  const year = document.getElementById('yearFilter')?.value || '';

  const filteredEmployees = employees.filter(employee => {
    const hireDate = new Date(employee.hireDate);
    const hireMonth = String(hireDate.getMonth() + 1).padStart(2, '0');
    const hireYear = String(hireDate.getFullYear());
    const empRole = config.roleMapping[employee.designation] || 'Unknown';
    const normalizedRole = empRole.toLowerCase().replace(' ', '_');

    return (
      (search === '' || employee.name.toLowerCase().includes(search) || employee.id.toLowerCase().includes(search)) &&
      (department === '' || employee.department === department) &&
      (designation === '' || employee.designation === designation) &&
      (role === 'all' || normalizedRole === role) &&
      (month === '' || hireMonth === month) &&
      (year === '' || hireYear === year)
    );
  });

  renderTable(filteredEmployees);
  renderPayrollChart();
}

function renderTable(data) {
  const tbody = document.querySelector('#employeeTable tbody');
  if (!tbody) {
    console.error('Employee table body not found');
    return;
  }
  tbody.innerHTML = '<tr><td colspan="8" class="text-center"><div class="loader"></div></td></tr>';
  setTimeout(() => {
    tbody.innerHTML = '';
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">No employees found</td></tr>';
      return;
    }
    data.forEach(employee => {
      const row = document.createElement('tr');
      const hireDate = new Date(employee.hireDate).toLocaleDateString('en-IN');
      row.innerHTML = `
        <td>${employee.id}</td>
        <td><img src="${employee.profilePic}" alt="Profile"></td>
        <td>${employee.name}</td>
        <td>${employee.department}</td>
        <td>${employee.designation}</td>
        <td>₹${employee.salary.toLocaleString('en-IN')}</td>
        <td>${hireDate}</td>
        <td>
          <span class="eye-icon" onclick="viewEmployee('${employee.id}')"><i class="fas fa-eye"></i></span>
          <span class="remove-icon" onclick="removeEmployee(this)"><i class="fas fa-trash"></i></span>
        </td>
      `;
      tbody.appendChild(row);
    });
  }, 1000);
}

function viewEmployee(id) {
  const employee = employees.find(emp => emp.id === id);
  if (employee) {
    document.getElementById('viewProfilePic').src = employee.profilePic;
    document.getElementById('viewEmployeeId').textContent = employee.id;
    document.getElementById('viewEmployeeName').textContent = employee.name;
    document.getElementById('viewEmployeeDepartment').textContent = employee.department;
    document.getElementById('viewEmployeeDesignation').textContent = employee.designation;
    document.getElementById('viewEmployeeSalary').textContent = `₹${employee.salary.toLocaleString('en-IN')}`;
    document.getElementById('viewEmployeeHireDate').textContent = new Date(employee.hireDate).toLocaleDateString('en-IN');

    const modal = new bootstrap.Modal(document.getElementById('viewEmployeeModal'));
    modal.show();
  }
}

function addEmployee() {
  const id = document.getElementById('employeeId').value;
  const name = document.getElementById('employeeName').value.trim();
  const department = document.getElementById('employeeDepartment').value;
  const designation = document.getElementById('employeeDesignation').value;
  const salary = parseFloat(document.getElementById('employeeSalary').value);
  const hireDate = document.getElementById('employeeHireDate').value;
  const profilePicInput = document.getElementById('employeeProfilePic');
  let profilePic = 'https://randomuser.me/api/portraits/lego/1.jpg';

  if (profilePicInput?.files && profilePicInput.files[0]) {
    profilePic = URL.createObjectURL(profilePicInput.files[0]);
  }

  if (id && name && department && designation && !isNaN(salary) && hireDate) {
    employees.push({ id, name, department, designation, salary, hireDate, profilePic, type: 'non-teaching' });
    saveEmployees();
    filterEmployees();
    document.getElementById('addEmployeeForm').reset();
    document.getElementById('employeeId').value = '';
    document.getElementById('profilePicPreview').style.display = 'none';
    const modal = bootstrap.Modal.getInstance(document.getElementById('addEmployeeModal'));
    modal.hide();
  } else {
    alert('Please fill all required fields correctly.');
  }
}

function removeEmployee(element) {
  if (confirm('Are you sure you want to remove this employee?')) {
    const row = element.closest('tr');
    const id = row.cells[0].textContent;
    employees = employees.filter(employee => employee.id !== id);
    saveEmployees();
    filterEmployees();
  }
}

function downloadEmployees() {
  const headers = ['Employee ID', 'Name', 'Department', 'Designation', 'Role', 'Salary', 'Hire Date'];
  const rows = employees.map(emp => [
    emp.id,
    emp.name,
    emp.department,
    emp.designation,
    config.roleMapping[emp.designation] || 'Unknown',
    emp.salary,
    new Date(emp.hireDate).toLocaleDateString('en-IN')
  ]);

  let csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n' + rows.map(row => row.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'non_teaching_employees.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function initializeProfilePicPreview() {
  const profilePicInput = document.getElementById('employeeProfilePic');
  if (profilePicInput) {
    profilePicInput.addEventListener('change', function(e) {
      const preview = document.getElementById('profilePicPreview');
      if (e.target.files && e.target.files[0]) {
        preview.src = URL.createObjectURL(e.target.files[0]);
        preview.style.display = 'block';
      } else {
        preview.style.display = 'none';
      }
    });
  }
}

function initializeModal() {
  const addEmployeeModal = document.getElementById('addEmployeeModal');
  if (addEmployeeModal) {
    addEmployeeModal.addEventListener('show.bs.modal', () => {
      document.getElementById('employeeId').value = generateEmployeeId();
    });
  }
}

function initializeThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      themeToggle.classList.toggle('fa-moon');
      themeToggle.classList.toggle('fa-sun');
    });
  }
}

function initializeAdminActions() {
  document.getElementById('profile-link')?.addEventListener('click', () => {
    alert('Navigating to Profile...');
  });
  document.getElementById('settings-link')?.addEventListener('click', () => {
    alert('Opening Settings...');
  });
  document.getElementById('logout-link')?.addEventListener('click', () => {
    alert('Logging out...');
  });
}

let payrollChart;
async function renderPayrollChart() {
  try {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const department = document.getElementById('departmentFilter')?.value || '';
    const designation = document.getElementById('designationFilter')?.value || '';
    const role = document.getElementById('roleFilter')?.value || 'all';
    const month = document.getElementById('monthFilter')?.value || '';
    const year = document.getElementById('yearFilter')?.value || '';

    const filteredEmployees = employees.filter(employee => {
      const hireDate = new Date(employee.hireDate);
      const hireMonth = String(hireDate.getMonth() + 1).padStart(2, '0');
      const hireYear = String(hireDate.getFullYear());
      const empRole = config.roleMapping[employee.designation] || 'Unknown';
      const normalizedRole = empRole.toLowerCase().replace(' ', '_');

      return (
        (search === '' || employee.name.toLowerCase().includes(search) || employee.id.toLowerCase().includes(search)) &&
        (department === '' || employee.department === department) &&
        (designation === '' || employee.designation === designation) &&
        (role === 'all' || normalizedRole === role) &&
        (month === '' || hireMonth === month) &&
        (year === '' || hireYear === year)
      );
    });

    const summary = {
      administrative: 0,
      support_staff: 0
    };

    filteredEmployees.forEach(emp => {
      const empRole = config.roleMapping[emp.designation]?.toLowerCase().replace(' ', '_') || '';
      if (summary.hasOwnProperty(empRole)) {
        summary[empRole] += Number(emp.salary) || 0;
      }
    });

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

    const labels = role === 'all' ? ['Administrative', 'Support Staff'] : [role === 'administrative' ? 'Administrative' : 'Support Staff'];
    const data = role === 'all' ? [summary.administrative, summary.support_staff] : [summary[role]];
    const backgroundColor = role === 'all' ? [primaryColor, secondaryColor] : [role === 'administrative' ? primaryColor : secondaryColor];

    payrollChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Total Payroll (₹)',
          data,
          backgroundColor
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

function initializeEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const departmentFilter = document.getElementById('departmentFilter');
  const designationFilter = document.getElementById('designationFilter');
  const roleFilter = document.getElementById('roleFilter');
  const monthFilter = document.getElementById('monthFilter');
  const yearFilter = document.getElementById('yearFilter');

  if (searchInput) searchInput.addEventListener('input', filterEmployees);
  if (departmentFilter) departmentFilter.addEventListener('change', filterEmployees);
  if (designationFilter) designationFilter.addEventListener('change', filterEmployees);
  if (roleFilter) roleFilter.addEventListener('change', filterEmployees);
  if (monthFilter) monthFilter.addEventListener('change', filterEmployees);
  if (yearFilter) yearFilter.addEventListener('change', filterEmployees);
}

function init() {
  initializeStorage();
  initializeDropdowns();
  initializeRoleFilter();
  initializeSidebar();
  initializeProfilePicPreview();
  initializeModal();
  initializeEventListeners();
  initializeThemeToggle();
  initializeAdminActions();
  filterEmployees();
  renderPayrollChart();
}

document.addEventListener('DOMContentLoaded', init);