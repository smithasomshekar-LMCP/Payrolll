
    const config = {
      departments: ['Admin', 'Accounts', 'Maintenance'],
      designations: ['Clerk', 'Peon', 'Cleaner']
    };

    let employees = [];

    function initializeStorage() {
      try {
        if (!localStorage.getItem('nonTeachingEmployees')) {
          localStorage.setItem('nonTeachingEmployees', JSON.stringify([]));
        }
        employees = JSON.parse(localStorage.getItem('nonTeachingEmployees') || '[]');
      } catch (error) {
        console.error('Error initializing localStorage:', error);
        employees = [];
      }
    }

    function saveEmployees() {
      try {
        localStorage.setItem('nonTeachingEmployees', JSON.stringify(employees));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }

    function initializeDropdowns() {
      const departmentFilter = document.getElementById('departmentFilter');
      const designationFilter = document.getElementById('designationFilter');
      const employeeDepartment = document.getElementById('employeeDepartment');
      const employeeDesignation = document.getElementById('employeeDesignation');

      config.departments.forEach(dept => {
        departmentFilter.innerHTML += `<option value="${dept}">${dept}</option>`;
        employeeDepartment.innerHTML += `<option value="${dept}">${dept}</option>`;
      });

      config.designations.forEach(design => {
        designationFilter.innerHTML += `<option value="${design}">${design}</option>`;
        employeeDesignation.innerHTML += `<option value="${design}">${design}</option>`;
      });
    }

    function initializeDatePicker() {
      flatpickr('#dateFilter', {
        dateFormat: 'Y-m',
        altInput: true,
        altFormat: 'F Y',
        mode: 'single',
        static: true,
        onChange: () => {
          filterEmployees();
        }
      });
    }

    function generateEmployeeId() {
      const nonTeaching = JSON.parse(localStorage.getItem('nonTeachingEmployees') || '[]');
      const maxId = nonTeaching.length > 0 ? Math.max(...nonTeaching.map(emp => parseInt(emp.id.replace('EMP', '')))) : 0;
      return `EMP${String(maxId + 1).padStart(3, '0')}`;
    }

    function initializeSidebar() {
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
      const search = document.getElementById('searchInput').value.toLowerCase();
      const department = document.getElementById('departmentFilter').value;
      const designation = document.getElementById('designationFilter').value; // Fixed typo
      const dateFilter = document.getElementById('dateFilter').value;

      const filteredEmployees = employees.filter(employee => {
        const hireDate = new Date(employee.hireDate);
        const hireMonthYear = `${hireDate.getFullYear()}-${String(hireDate.getMonth() + 1).padStart(2, '0')}`;

        return (
          (search === '' || employee.name.toLowerCase().includes(search) || employee.id.toLowerCase().includes(search)) &&
          (department === '' || employee.department === department) &&
          (designation === '' || employee.designation === designation) &&
          (dateFilter === '' || hireMonthYear === dateFilter)
        );
      });

      renderTable(filteredEmployees);
    }

    function renderTable(data) {
      const tbody = document.querySelector('#employeeTable tbody');
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
            <td>₹ ${employee.salary.toLocaleString('en-IN')}</td>
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
        document.getElementById('viewEmployeeSalary').textContent = `₹ ${employee.salary.toLocaleString('en-IN')}`;
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

      if (profilePicInput.files && profilePicInput.files[0]) {
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
      const headers = ['Employee ID', 'Name', 'Department', 'Designation', 'Salary', 'Hire Date'];
      const rows = employees.map(emp => [
        emp.id,
        emp.name,
        emp.department,
        emp.designation,
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
      document.getElementById('searchInput').addEventListener('input', filterEmployees);
      document.getElementById('departmentFilter').addEventListener('change', filterEmployees);
      document.getElementById('designationFilter').addEventListener('change', filterEmployees);
    }

    function init() {
      initializeStorage();
      initializeDropdowns();
      initializeDatePicker();
      initializeSidebar();
      initializeProfilePicPreview();
      initializeModal();
      initializeEventListeners();
      initializeThemeToggle();
      initializeAdminActions();
      filterEmployees();
    }

    document.addEventListener('DOMContentLoaded', init);
