
    // Focus Trap Utility
    function trapFocus(modalElement) {
      const focusableElements = modalElement.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      modalElement.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
              e.preventDefault();
              lastFocusable.focus();
            }
          } else {
            if (document.activeElement === lastFocusable) {
              e.preventDefault();
              firstFocusable.focus();
            }
          }
        }
      });

      return firstFocusable;
    }

    // Disable Focusable Elements
    function disableFocusableElements(modalElement) {
      const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusableElements.forEach(el => {
        el.setAttribute('tabindex', '-1');
      });
    }

    // Enable Focusable Elements
    function enableFocusableElements(modalElement) {
      const focusableElements = modalElement.querySelectorAll('[tabindex="-1"]');
      focusableElements.forEach(el => {
        el.removeAttribute('tabindex');
      });
    }

    // Sidebar Toggle
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
      }
    }

    // Back Button
    function initializeBackButton() {
      const backBtn = document.querySelector('#backBtn');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          window.location.href = 'dashboard.html';
        });
      }
    }

    // Theme Toggle
    function initializeThemeToggle() {
      const themeToggle = document.getElementById('theme-toggle');
      const body = document.body;
      if (themeToggle && body) {
        themeToggle.addEventListener('click', () => {
          body.classList.toggle('dark-mode');
          themeToggle.classList.toggle('fa-moon');
          themeToggle.classList.toggle('fa-sun');
          localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
        });

        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
          body.classList.add('dark-mode');
          themeToggle.classList.remove('fa-moon');
          themeToggle.classList.add('fa-sun');
        }
      }
    }

    // PDF Download
    function initializePDFDownload() {
      const { jsPDF } = window.jspdf;
      const downloadBtn = document.getElementById('downloadPdfBtn');
      if (downloadBtn && jsPDF && window.html2canvas) {
        downloadBtn.addEventListener('click', async () => {
          try {
            downloadBtn.disabled = true;
            const payslipContent = document.getElementById('payslipContent');
            if (!payslipContent) throw new Error('Payslip content not found');
            const canvas = await html2canvas(payslipContent, {
              scale: 2,
              useCORS: true,
              logging: false
            });
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4'
            });
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`payslip_${document.getElementById('empId').textContent || 'unknown'}.pdf`);
          } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
          } finally {
            downloadBtn.disabled = false;
          }
        });
      }
    }

    // Employee Management
    function initializeEmployeeManagement() {
      const employeeSelect = document.getElementById('employeeSelect');
      const payslipBox = document.getElementById('payslipBox');
      const payslipLoading = document.getElementById('payslipLoading');
      const payslipError = document.getElementById('payslipError');
      const payslipContent = document.getElementById('payslipContent');
      const form = document.getElementById('payslipForm');
      const saveBtn = document.getElementById('savePayslip');
      const deleteBtn = document.getElementById('deletePayslip');
      const modal = document.getElementById('inputModal');
      const modalBs = new bootstrap.Modal(modal);
      const modalTitle = document.getElementById('inputModalLabel');
      const addEditEmployeeBtn = document.getElementById('addEditEmployeeBtn');
      const alertContainer = document.getElementById('alertContainer');
      let lastFocusedElement = null;

      const inputs = {
        index: document.getElementById('employeeIndex'),
        type: document.getElementById('employeeType'),
        name: document.getElementById('inputName'),
        id: document.getElementById('inputId'),
        department: document.getElementById('inputDepartment'),
        designation: document.getElementById('inputDesignation'),
        period: document.getElementById('inputPeriod'),
        days: document.getElementById('inputDays'),
        basic: document.getElementById('inputBasic'),
        hra: document.getElementById('inputHra'),
        da: document.getElementById('inputDa'),
        lop: document.getElementById('inputLop'),
        tax: document.getElementById('inputTax'),
        epf: document.getElementById('inputEpf')
      };

      if (!employeeSelect || !payslipBox || !payslipLoading || !payslipError || !payslipContent || !form || !saveBtn || !deleteBtn || !modal || !modalTitle || !addEditEmployeeBtn || !alertContainer) {
        console.error('One or more required DOM elements are missing');
        payslipError.textContent = 'Page initialization failed. Please refresh.';
        payslipError.style.display = 'block';
        return;
      }

      function getAllEmployees() {
        try {
          const teaching = JSON.parse(localStorage.getItem('teachingEmployees') || '[]');
          const nonTeaching = JSON.parse(localStorage.getItem('nonTeachingEmployees') || '[]');
          return [...teaching, ...nonTeaching];
        } catch (error) {
          console.error('Error fetching employees from localStorage:', error);
          return [];
        }
      }

      function savePayslip(employeeId, payslipData) {
        try {
          const payslips = JSON.parse(localStorage.getItem('payslips') || '{}');
          payslips[employeeId] = payslipData;
          localStorage.setItem('payslips', JSON.stringify(payslips));
        } catch (error) {
          console.error('Error saving payslip to localStorage:', error);
        }
      }

      function deletePayslip(employeeId) {
        try {
          const payslips = JSON.parse(localStorage.getItem('payslips') || '{}');
          delete payslips[employeeId];
          localStorage.setItem('payslips', JSON.stringify(payslips));
        } catch (error) {
          console.error('Error deleting payslip from localStorage:', error);
        }
      }

      async function populateEmployeeSelect() {
        try {
          employeeSelect.disabled = true;
          const employees = getAllEmployees();
          $(employeeSelect).empty().append('<option value="">Select Employee</option>');
          employees.forEach(emp => {
            if (emp.id && emp.name && emp.type) {
              $(employeeSelect).append(
                `<option value="${emp.id}|${emp.type}">${emp.name} (${emp.type === 'teaching' ? 'Teaching' : 'Non-Teaching'})</option>`
              );
            }
          });
          if (employees.length === 0) {
            $(employeeSelect).empty().append('<option value="">No Employees Found</option>');
          }
        } catch (error) {
          console.error('Error populating employee select:', error);
          $(employeeSelect).empty().append('<option value="">Error loading employees</option>');
          payslipError.textContent = 'Failed to load employees. Please try again.';
          payslipError.style.display = 'block';
        } finally {
          employeeSelect.disabled = false;
          $(employeeSelect).select2({
            placeholder: 'Search Employee by Name',
            allowClear: true,
            width: '100%',
            dropdownCssClass: document.body.classList.contains('dark-mode') ? 'dark-mode' : ''
          });
        }
      }

      function validateInputs() {
        let isValid = true;
        Object.entries(inputs).forEach(([key, input]) => {
          if (['index', 'type', 'id', 'name', 'department', 'designation'].includes(key)) return;
          const errorDiv = document.getElementById(`${key}Error`);
          if (!input.value) {
            input.classList.add('is-invalid');
            errorDiv.textContent = 'This field is required';
            isValid = false;
          } else if (['basic', 'hra', 'da', 'lop', 'tax', 'epf'].includes(key) && parseFloat(input.value) < 0) {
            input.classList.add('is-invalid');
            errorDiv.textContent = 'Value cannot be negative';
            isValid = false;
          } else {
            input.classList.remove('is-invalid');
            errorDiv.textContent = '';
          }
        });
        return isValid;
      }

      async function updatePayslip(employeeId, employeeType) {
        try {
          payslipBox.style.display = 'block';
          payslipLoading.style.display = 'flex';
          payslipError.style.display = 'none';
          payslipContent.style.display = 'none';

          const storageKey = employeeType === 'teaching' ? 'teachingEmployees' : 'nonTeachingEmployees';
          const employees = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const employee = employees.find(emp => emp.id === employeeId);

          if (!employee) {
            throw new Error('Employee not found');
          }

          const salary = parseFloat(employee.salary) || 0;
          const payslip = {
            name: employee.name || 'N/A',
            id: employee.id || 'N/A',
            department: employee.department || 'N/A',
            designation: employee.designation || 'N/A',
            period: 'April 2025',
            days: '28/30',
            basic: salary ? Math.round(salary * 0.5) : 0,
            hra: salary ? Math.round(salary * 0.3) : 0,
            da: salary ? Math.round(salary * 0.2) : 0,
            lop: 0,
            tax: salary ? Math.round(salary * 0.1) : 0,
            epf: salary ? Math.round(salary * 0.12) : 0
          };

          const payslips = JSON.parse(localStorage.getItem('payslips') || '{}');
          if (payslips[employee.id]) {
            Object.assign(payslip, payslips[employee.id]);
          }

          payslipContent.style.display = 'block';
          document.getElementById('empName').textContent = payslip.name;
          document.getElementById('empId').textContent = payslip.id;
          document.getElementById('payPeriod').textContent = payslip.period;
          document.getElementById('workedDays').textContent = payslip.days;
          document.getElementById('basic').textContent = payslip.basic ? payslip.basic.toLocaleString('en-IN') : '0';
          document.getElementById('hra').textContent = payslip.hra ? payslip.hra.toLocaleString('en-IN') : '0';
          document.getElementById('da').textContent = payslip.da ? payslip.da.toLocaleString('en-IN') : '0';
          document.getElementById('lop').textContent = payslip.lop ? payslip.lop.toLocaleString('en-IN') : '0';
          document.getElementById('tax').textContent = payslip.tax ? payslip.tax.toLocaleString('en-IN') : '0';
          document.getElementById('epf').textContent = payslip.epf ? payslip.epf.toLocaleString('en-IN') : '0';

          const totalIncome = (payslip.basic || 0) + (payslip.hra || 0) + (payslip.da || 0);
          const totalDeductions = (payslip.lop || 0) + (payslip.tax || 0) + (payslip.epf || 0);
          const netPay = totalIncome - totalDeductions;
          document.getElementById('netPay').textContent = netPay.toLocaleString('en-IN');
        } catch (error) {
          console.error('Error updating payslip:', error);
          payslipError.textContent = 'Failed to load payslip. Please try again.';
          payslipError.style.display = 'block';
          payslipContent.style.display = 'none';
          payslipBox.style.display = 'none';
        } finally {
          payslipLoading.style.display = 'none';
        }
      }

      function clearForm() {
        try {
          form.reset();
          inputs.index.value = '';
          inputs.type.value = '';
          inputs.name.value = '';
          inputs.id.value = '';
          inputs.department.value = '';
          inputs.designation.value = '';
          inputs.period.value = '';
          inputs.days.value = '';
          inputs.basic.value = '';
          inputs.hra.value = '';
          inputs.da.value = '';
          inputs.lop.value = '';
          inputs.tax.value = '';
          inputs.epf.value = '';
          Object.values(inputs).forEach(input => input.classList.remove('is-invalid'));
          Object.keys(inputs).forEach(key => {
            document.getElementById(`${key}Error`).textContent = '';
          });
          modalTitle.textContent = 'Edit Payslip';
          deleteBtn.style.display = 'none';
        } catch (error) {
          console.error('Error clearing form:', error);
        }
      }

      function populateForm(employee, type) {
        try {
          inputs.index.value = employee.id || '';
          inputs.type.value = type || '';
          inputs.name.value = employee.name || '';
          inputs.id.value = employee.id || '';
          inputs.department.value = employee.department || '';
          inputs.designation.value = employee.designation || '';
          const payslips = JSON.parse(localStorage.getItem('payslips') || '{}');
          const payslip = payslips[employee.id] || {};
          inputs.period.value = payslip.period || 'April 2025';
          inputs.days.value = payslip.days || '28/30';
          inputs.basic.value = payslip.basic || (employee.salary ? Math.round(employee.salary * 0.5) : 0);
          inputs.hra.value = payslip.hra || (employee.salary ? Math.round(employee.salary * 0.3) : 0);
          inputs.da.value = payslip.da || (employee.salary ? Math.round(employee.salary * 0.2) : 0);
          inputs.lop.value = payslip.lop || 0;
          inputs.tax.value = payslip.tax || (employee.salary ? Math.round(employee.salary * 0.1) : 0);
          inputs.epf.value = payslip.epf || (employee.salary ? Math.round(employee.salary * 0.12) : 0);
          modalTitle.textContent = 'Edit Payslip';
          deleteBtn.style.display = payslips[employee.id] ? 'inline-block' : 'none';
        } catch (error) {
          console.error('Error populating form:', error);
        }
      }

      function showAlert(message) {
        alertContainer.innerHTML = `
          <div class="alert alert-warning alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        `;
        alertContainer.style.display = 'block';
        setTimeout(() => {
          alertContainer.style.display = 'none';
          alertContainer.innerHTML = '';
        }, 5000);
      }

      $(employeeSelect).on('change', async () => {
        try {
          const value = $(employeeSelect).val();
          if (value) {
            const [employeeId, employeeType] = value.split('|');
            const storageKey = employeeType === 'teaching' ? 'teachingEmployees' : 'nonTeachingEmployees';
            const employees = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const employee = employees.find(emp => emp.id === employeeId);
            if (employee) {
              await updatePayslip(employeeId, employeeType);
            } else {
              payslipError.textContent = 'Employee not found.';
              payslipError.style.display = 'block';
              payslipBox.style.display = 'none';
            }
          } else {
            payslipBox.style.display = 'none';
            payslipError.style.display = 'none';
          }
        } catch (error) {
          console.error('Error handling employee select change:', error);
          payslipError.textContent = 'Failed to load payslip. Please try again.';
          payslipError.style.display = 'block';
          payslipBox.style.display = 'none';
        }
      });

      addEditEmployeeBtn.addEventListener('click', () => {
        try {
          const value = $(employeeSelect).val();
          if (!value) {
            showAlert('Please select an employee to edit.');
            return;
          }
          lastFocusedElement = document.activeElement;
          const [employeeId, employeeType] = value.split('|');
          const storageKey = employeeType === 'teaching' ? 'teachingEmployees' : 'nonTeachingEmployees';
          const employees = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const employee = employees.find(emp => emp.id === employeeId);
          if (employee) {
            clearForm();
            populateForm(employee, employeeType);
            disableFocusableElements(document.body);
            modalBs.show();
            const firstFocusable = trapFocus(modal);
            firstFocusable.focus();
          } else {
            showAlert('Employee not found. Please select a valid employee.');
          }
        } catch (error) {
          console.error('Error opening edit modal:', error);
          showAlert('Failed to open edit modal. Please try again.');
        }
      });

      modal.addEventListener('shown.bs.modal', () => {
        const firstFocusable = trapFocus(modal);
        firstFocusable.focus();
      });

      modal.addEventListener('hidden.bs.modal', () => {
        enableFocusableElements(document.body);
        if (lastFocusedElement) {
          lastFocusedElement.focus();
          lastFocusedElement = null;
        }
      });

      saveBtn.addEventListener('click', async () => {
        try {
          if (!validateInputs()) return;
          saveBtn.disabled = true;
          const employeeId = inputs.id.value;
          const employeeType = inputs.type.value;
          if (!employeeId || !employeeType) {
            payslipError.textContent = 'Please select an employee first.';
            payslipError.style.display = 'block';
            return;
          }
          const payslipData = {
            period: inputs.period.value,
            days: inputs.days.value,
            basic: parseFloat(inputs.basic.value) || 0,
            hra: parseFloat(inputs.hra.value) || 0,
            da: parseFloat(inputs.da.value) || 0,
            lop: parseFloat(inputs.lop.value) || 0,
            tax: parseFloat(inputs.tax.value) || 0,
            epf: parseFloat(inputs.epf.value) || 0
          };
          savePayslip(employeeId, payslipData);
          modalBs.hide();
          $(employeeSelect).val(`${employeeId}|${employeeType}`).trigger('change');
        } catch (error) {
          console.error('Error saving payslip:', error);
          payslipError.textContent = 'Failed to save payslip. Please try again.';
          payslipError.style.display = 'block';
        } finally {
          saveBtn.disabled = false;
        }
      });

      deleteBtn.addEventListener('click', async () => {
        try {
          if (confirm('Are you sure you want to delete this payslip?')) {
            deleteBtn.disabled = true;
            const employeeId = inputs.id.value;
            const employeeType = inputs.type.value;
            if (!employeeId || !employeeType) {
              payslipError.textContent = 'Please select an employee first.';
              payslipError.style.display = 'block';
              return;
            }
            deletePayslip(employeeId);
            modalBs.hide();
            payslipBox.style.display = 'none';
            $(employeeSelect).val('').trigger('change');
          }
        } catch (error) {
          console.error('Error deleting payslip:', error);
          payslipError.textContent = 'Failed to delete payslip. Please try again.';
          payslipError.style.display = 'block';
        } finally {
          deleteBtn.disabled = false;
        }
      });

      employeeSelect.addEventListener('focus', async () => {
        await populateEmployeeSelect();
      });

      document.querySelectorAll('#payslipForm input').forEach(input => {
        input.addEventListener('input', () => {
          input.classList.remove('is-invalid');
          document.getElementById(`${input.id.replace('input', '').toLowerCase()}Error`).textContent = '';
        });
      });

      // Initialize employee select on page load
      populateEmployeeSelect();
    }

    // Initialize all functionalities
    document.addEventListener('DOMContentLoaded', () => {
      try {
        initializeSidebar();
        initializeBackButton();
        initializeThemeToggle();
        initializePDFDownload();
        initializeEmployeeManagement();
      } catch (error) {
        console.error('Error initializing page:', error);
        const errorDiv = document.getElementById('payslipError');
        if (errorDiv) {
          errorDiv.textContent = 'Failed to initialize page. Please refresh and try again.';
          errorDiv.style.display = 'block';
        }
      }
    });
 