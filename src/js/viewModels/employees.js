define(
['knockout',
'ojs/ojknockouttemplateutils',
'ojs/ojarraydataprovider',
'hr-table/loader'],
function(ko, KnockoutTemplateUtils, ArrayDataProvider) {

    function EmployeeViewModel() {

        const self = this;

        self.hasCreatePrivilege = ko.observable(authconfig.hasCreatePrivilege());
        self.hasEditPrivilege = ko.observable(authconfig.hasEditPrivilege());
        self.hasDeletePrivilege = ko.observable(authconfig.hasDeletePrivilege());

        self.messages = {
            duplicate_employee: i18nutils.translate('messages.employees.duplicate_employee'),
            not_exist_employee: i18nutils.translate('messages.employees.not_exist_employee'),
            not_exist_department: i18nutils.translate('messages.employees.not_exist_department'),
            email_not_formatted: i18nutils.translate('messages.employees.email_not_formatted'),
            manager_employee_diff: i18nutils.translate('messages.employees.manager_employee_diff'),
            manager_employee_valid: function(manager, department) {
                return i18nutils.translate('messages.employees.manager_employee_valid', {
                    manager: manager,
                    department: department
                })
            },
        };

        self.getDateFormatter = function(date) {
            return formatterutils.getStringFromDate(date, 'medium');
        };

        self.getCurrencyFormatter = function(value) {
            return formatterutils.getCurrencyString(value, 'INR');
        };

        self.getPhoneNumberFormatter = function(value) {
            return formatterutils.getPhoneNumberString(value);
        };

        self.employeeJobs = ko.observable(new ArrayDataProvider([]));

        (function() {
            const successFn = function(data) {
                const jobs = [];
                if (!!data && !!data.items && Array.isArray(data.items)) {
                    data.items.forEach(function(job) {
                        jobs.push({ value: job.JobId, label: `${job.JobId}: ${job.JobTitle}` });
                    });
                }
                self.employeeJobs(new ArrayDataProvider(jobs, { keyAttributes: 'value' }));
            };
            restutils.getRestData('jobs?sortBy=JobTitle:asc', null, successFn, function() { });
        })();

        self.validateUniqueEmployee = {
            validate: function(value) {
                return new Promise(function(resolve, reject) {
                    if (!value) {
                        resolve();
                    } else {
                        restutils.getRestData('employees/' + value, null,
                        function() { reject({ detail: self.messages.duplicate_employee}); },
                        function() { resolve(); })
                    }
                });
            }
        };

        self.validateExistingEmployee = {
            validate: function(value) {
                return new Promise(function(resolve, reject) {
                    if (!value) {
                        resolve();
                    } else {
                        restutils.getRestData('employees/' + value, null,
                        function() { resolve(); },
                        function() { reject({ detail: self.messages.not_exist_employee}); })
                    }
                });
            }
        };

        self.validateExistingDepartment = {
            validate: function(value) {
                return new Promise(function(resolve, reject) {
                    if (!value) {
                        resolve();
                    } else {
                        restutils.getRestData('departments/' + value, null,
                        function() { resolve(); },
                        function() { reject({ detail: self.messages.not_exist_department}); })
                    }
                });
            }
        };

        self.emailValidator = {
            type: 'regExp',
            options: {
                pattern: "[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*",
                messageDetail: self.messages.email_not_formatted
            }
        };

        self.validators = [
            self.emailValidator
        ];

        self.asyncvalidators = [
            self.validateUniqueEmployee,
            self.validateExistingEmployee,
            self.validateExistingDepartment
        ];

        self.parseEmployee = function(response) {
            return {
                EmployeeId: response.EmployeeId,
                FirstName: (response.FirstName === undefined ? '' : response.FirstName),
                LastName: response.LastName,
                Email: response.Email,
                PhoneNumber: response.PhoneNumber,
                HireDate: response.HireDate,
                JobId: response.JobId,
                Salary: response.Salary,
                CommissionPct: response.CommissionPct,
                ManagerId: response.ManagerId,
                DepartmentId: response.DepartmentId,
            };
        };
        self.idAttribute = 'EmployeeId';
        self.urlPath = 'employees';

        self.employeeColumns = [
            { headerText: 'Employee Id', field: 'EmployeeId', headerClassName: 'oj-sm-only-hide', className: 'oj-sm-only-hide' },
            { headerText: 'Name', renderer: KnockoutTemplateUtils.getRenderer('employee_fn_ln_template', true) },
            { headerText: 'Phone', renderer: KnockoutTemplateUtils.getRenderer('employee_pn_template', true), headerClassName: 'oj-sm-only-hide', className: 'oj-sm-only-hide' },
            { headerText: 'Hire Date', renderer: KnockoutTemplateUtils.getRenderer('employee_hd_template', true), headerClassName: 'oj-sm-only-hide', className: 'oj-sm-only-hide' },
            { headerText: 'Email', field: 'Email' },
            { headerText: 'Job Id', field: 'JobId', headerClassName: 'oj-sm-only-hide', className: 'oj-sm-only-hide' },
            { headerText: 'Salary', renderer: KnockoutTemplateUtils.getRenderer('employee_sa_template', true), headerClassName: 'oj-sm-only-hide', className: 'oj-sm-only-hide' },
            { headerText: 'Commission', field: 'CommissionPct', headerClassName: 'oj-sm-only-hide', className: 'oj-sm-only-hide' },
            { headerText: 'Manager Id', field: 'ManagerId', headerClassName: 'oj-sm-only-hide', className: 'oj-sm-only-hide' },
            { headerText: 'Department Id', field: 'DepartmentId', headerClassName: 'oj-sm-only-hide', className: 'oj-sm-only-hide' }
        ];

        self.employeeTableProperties = {
            columns: self.employeeColumns,
            sortOptions: 'EmployeeId:asc',
            toolbar: [
                {
                    name: 'create',
                    label: 'Create',
                    iconOnly: false,
                    handler: 'addHandler',
                    disabled: !authconfig.hasCreatePrivilege()
                },
                {
                    name: 'edit',
                    label: 'Edit',
                    iconOnly: false,
                    handler: 'editHandler',
                    disabled: !authconfig.hasEditPrivilege()
                },
                {
                    name: 'delete',
                    label: 'Delete',
                    iconOnly: false,
                    handler: 'deleteHandler',
                    disabled: !authconfig.hasDeletePrivilege()
                }
            ],
            selection: {
                row: 'single',
                column: 'none'
            },
            edit: {
                attributes: [
                    { componentId: 'employee_ei', field: 'EmployeeId', component: 'ojInputNumber', label: 'Id', required: true,
                      editable: 'while-new', asyncvalidators: [ self.asyncvalidators[0] ] },
                    { componentId: 'employee_fn', field: 'FirstName', component: 'ojInputText', label: 'First Name', editable: 'always' },
                    { componentId: 'employee_ln', field: 'LastName', component: 'ojInputText', label: 'Last Name', required: true, editable: 'always' },
                    { componentId: 'employee_em', field: 'Email', component: 'ojInputText', label: 'Email', required: true, editable: 'always',
                      validators: [ self.validators[0] ] },
                    { componentId: 'employee_pn', field: 'PhoneNumber', component: 'ojInputText', label: 'Phone', editable: 'always' },
                    { componentId: 'employee_hd', field: 'HireDate', component: 'ojInputDate', label: 'Hire Date', required: true, editable: 'always' },
                    { componentId: 'employee_ji', field: 'JobId', component: 'ojSelectOne', label: 'Job', required: true, editable: 'always',
                      options: self.employeeJobs },
                    { componentId: 'employee_sa', field: 'Salary', component: 'ojInputNumber', label: 'Salary', editable: 'always' },
                    { componentId: 'employee_cp', field: 'CommissionPct', component: 'ojInputNumber', label: 'Commission', editable: 'always' },
                    { componentId: 'employee_mi', field: 'ManagerId', component: 'ojInputNumber', label: 'Manager', editable: 'always',
                      asyncvalidators: [ self.asyncvalidators[1] ] },
                    { componentId: 'employee_di', field: 'DepartmentId', component: 'ojInputNumber', label: 'Department', editable: 'always',
                      asyncvalidators: [ self.asyncvalidators[2] ] }
                ]
            }
        };

        self.employeeModelProperties = {
            modelparams: {
                urlPath: self.urlPath,
                idAttribute: self.idAttribute,
                parse: self.parseEmployee
            },
            preSave: function(data) {
                return new Promise(function(resolve, reject) {
                    if (data.EmployeeId === data.ManagerId) {
                        reject(self.messages.manager_employee_diff);
                    } else {
                        if (!!data.DepartmentId && data.ManagerId) {
                            const successFn = function(department) {
                                if (!!department && department.ManagerId === data.ManagerId) {
                                    resolve();
                                } else {
                                    reject(self.messages.manager_employee_valid(data.ManagerId, data.DepartmentId));
                                }
                            };
                            const errorFn = function() {
                                resolve();
                            }
                            restutils.getRestData('departments/' + data.DepartmentId, null, successFn, errorFn);
                        } else {
                            resolve();
                        }
                    }
                });
            }
        };

        self.employeePagingProperties = {
            pagingEnabled: true,
            pageSize: 8
        };

        self.employeeTemplateProperties = {
            employeeHireDate: self.getDateFormatter,
            employeeSalary: self.getCurrencyFormatter,
            employeePhoneNumber: self.getPhoneNumberFormatter
        };        

        self.employeeSearchProperties = {
            showSearch: true,
            searchPlaceholder: 'Search...'
        }

    }

    return EmployeeViewModel;

});