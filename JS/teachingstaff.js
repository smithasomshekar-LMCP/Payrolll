const config = {
  departments: ['CSE', 'ECE', 'MECH', 'EEE'],
  designations: ['Associate Professor', 'Assistant Professor']
};

let employees = [];

function initializeStorage() {
  try {
    if (!localStorage.getItem('teachingEmployees')) {
      localStorage.setItem('teachingEmployees', JSON.stringify([]));
    }
    employees = JSON.parse(localStorage.getItem('teachingEmployees') || '[]');
  } catch (error) {
    console.error('Error initializing localStorage:', error);
    employees = [];
  }
}

function saveEmployees() {
  try {
    localStorage.setItem('teachingEmployees', JSON.stringify(employees));
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
  }

  if (designationFilter) {
    designationFilter.innerHTML = '<option value="">All Designations</option>' + 
      config.designations.map(design => `<option value="${design}">${design}</option>`).join('');
  }

  if (employeeDepartment) {
    employeeDepartment.innerHTML = config.departments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
  }

  if (employeeDesignation) {
    employeeDesignation.innerHTML = config.designations.map(design => `<option value="${design}">${design}</option>`).join('');
  }

  if (yearFilter) {
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 10}, (_, i) => currentYear - i);
    yearFilter.innerHTML = '<option value="">All Years</option>' + 
      years.map(year => `<option value="${year}">${year}</option>`).join('');
  }
}
/*
function generateEmployeeId() {
  const teaching = JSON.parse(localStorage.getItem('teachingEmployees') || '[]');
  const maxId = teaching.length > 0 ? Math.max(...teaching.map(emp => parseInt(emp.id.replace('EMP', '')))) : 0;
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
  const month = document.getElementById('monthFilter')?.value || '';
  const year = document.getElementById('yearFilter')?.value || '';

  const filteredEmployees = employees.filter(employee => {
    const hireDate = new Date(employee.hireDate);
    const hireMonth = String(hireDate.getMonth() + 1).padStart(2, '0');
    const hireYear = String(hireDate.getFullYear());

    return (
      (search === '' || employee.name.toLowerCase().includes(search) || employee.id.toLowerCase().includes(search)) &&
      (department === '' || employee.department === department) &&
      (designation === '' || employee.designation === designation) &&
      (month === '' || hireMonth === month) &&
      (year === '' || hireYear === year)
    );
  });

  renderTable(filteredEmployees);
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

  if (!name || !department || !designation || isNaN(salary) || salary <= 0 || !hireDate) {
    alert('Please fill all required fields correctly. Salary must be a positive number.');
    return;
  }

  if (profilePicInput.files && profilePicInput.files[0]) {
    profilePic = URL.createObjectURL(profilePicInput.files[0]);
  }

  employees.push({ id, name, department, designation, salary, hireDate, profilePic, type: 'teaching' });
  saveEmployees();
  filterEmployees();
  document.getElementById('addEmployeeForm').reset();
  document.getElementById('employeeId').value = '';
  document.getElementById('profilePicPreview').style.display = 'none';
  const modal = bootstrap.Modal.getInstance(document.getElementById('addEmployeeModal'));
  modal.hide();
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
  const headers = ['Employee ID', 'Name', 'Department', 'Designation', 'Salary', 'Hire Date', 'Profile Picture', 'Type'];
  const rows = employees.map(emp => [
    emp.id,
    emp.name,
    emp.department,
    emp.designation,
    emp.salary,
    emp.hireDate,
    emp.profilePic,
    emp.type
  ]);

  let csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n' + rows.map(row => row.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'teaching_employees.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function initializeProfilePicPreview() {
  document.getElementById('employeeProfilePic').addEventListener('change', function(e) {
    const preview = document.getElementById('profilePicPreview');
    if (e.target.files && e.target.files[0]) {
      preview.src = URL.createObjectURL(e.target.files[0]);
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }
  });
}

function initializeModal() {
  document.getElementById('addEmployeeModal').addEventListener('show.bs.modal', () => {
    document.getElementById('employeeId').value = generateEmployeeId();
  });
}

function initializeThemeToggle() {
  document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = document.getElementById('theme-toggle');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
  });
}

function initializeAdminActions() {
  document.getElementById('profile-link').addEventListener('click', () => {
    alert('Navigating to Profile...');
  });
  document.getElementById('settings-link').addEventListener('click', () => {
    alert('Opening Settings...');
  });
  document.getElementById('logout-link').addEventListener('click', () => {
    alert('Logging out...');
  });
}

function initializeEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const departmentFilter = document.getElementById('departmentFilter');
  const designationFilter = document.getElementById('designationFilter');
  const monthFilter = document.getElementById('monthFilter');
  const yearFilter = document.getElementById('yearFilter');

  if (searchInput) searchInput.addEventListener('input', filterEmployees);
  if (departmentFilter) departmentFilter.addEventListener('change', filterEmployees);
  if (designationFilter) designationFilter.addEventListener('change', filterEmployees);
  if (monthFilter) monthFilter.addEventListener('change', filterEmployees);
  if (yearFilter) yearFilter.addEventListener('change', filterEmployees);
}

function init() {
  initializeStorage();
  initializeDropdowns();
  initializeSidebar();
  initializeProfilePicPreview();
  initializeModal();
  initializeEventListeners();
  initializeThemeToggle();
  initializeAdminActions();
  filterEmployees();
}

document.addEventListener('DOMContentLoaded', init);