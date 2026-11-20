# Technomantra Project Memory

> This is a persistent locator map, not a claim that file contents are current. Read each target only once per task and rely on normal invalidation after edits.

- Workspace: SIKHAR Nodejs app
- Technology: React, Vite, Express, MySQL, Node.js/npm
- Active file at refresh: None
- Local code graph: 98 files · 311 edges · 0 matched flows
- Refreshed: 2026-11-20T08:17:54.343Z

## Framework Intelligence (V4.7.8)
- Profiles: react, node
- Package manager: npm
- Node framework: Express

### Entry / bootstrap candidates
- src/main.jsx
- src/App.jsx
- server.js
- index.html

### Components
- src/components/auth/AdminLogin.jsx
- src/components/auth/AuthPage.jsx
- src/components/common/AdminOptionSelect.jsx
- src/components/common/DocumentOcrScannerModal.jsx
- src/components/common/Icons.jsx
- src/components/compliance/ComplianceMasterPage.jsx
- src/components/dashboard/ExecutiveDashboard.jsx
- src/components/dashboard/ModuleViewer.jsx
- src/components/driver-portal/DriverDashboardOverview.jsx
- src/components/driver-portal/DriverInvoicesView.jsx
- src/components/driver-portal/DriverKycLockerView.jsx
- src/components/driver-portal/DriverPortalShell.jsx
- src/components/driver-portal/DriverProfileHub.jsx
- src/components/driver-portal/DriverShiftsView.jsx
- src/components/driver-portal/DriverSidebar.jsx
- src/components/driver-portal/DriverSupportView.jsx

### React component symbols
- src/App.jsx: App
- src/components/auth/AdminLogin.jsx: AdminLogin
- src/components/auth/AuthPage.jsx: AuthPage
- src/components/common/AdminOptionSelect.jsx: AdminOptionSelect, ADD_NEW_VALUE
- src/components/common/Icons.jsx: Compass, Home, Truck, Bus, Wrench
- src/components/compliance/ComplianceMasterPage.jsx: ComplianceMasterPage
- src/components/dashboard/ExecutiveDashboard.jsx: ExecutiveDashboard
- src/components/dashboard/ModuleViewer.jsx: ModuleViewer
- src/components/driver-portal/DriverDashboardOverview.jsx: DriverDashboardOverview
- src/components/driver-portal/DriverInvoicesView.jsx: DriverInvoicesView
- src/components/driver-portal/DriverKycLockerView.jsx: DriverKycLockerView
- src/components/driver-portal/DriverPortalShell.jsx: DriverPortalShell, Icon
- src/components/driver-portal/DriverProfileHub.jsx: DriverProfileHub
- src/components/driver-portal/DriverShiftsView.jsx: DriverShiftsView
- src/components/driver-portal/DriverSidebar.jsx: DriverSidebar, IconComp
- src/components/driver-portal/DriverSupportView.jsx: DriverSupportView
- src/components/driver-portal/DriverTopHeader.jsx: DriverTopHeader
- src/components/driver-portal/DriverVehicleView.jsx: DriverVehicleView
- src/components/driver-portal/DriverWalletView.jsx: DriverWalletView
- src/components/drivers/AllDriversListPage.jsx: AllDriversListPage
- src/components/drivers/DriverControlTower.jsx: DriverControlTower
- src/components/drivers/DriverDocumentsModal.jsx: DriverDocumentsModal, DOCUMENT_CATEGORIES
- src/components/drivers/FleetLiveLocationMap.jsx: FleetLiveLocationMap, FLEET_GPS_TELEMETRY
- src/components/escalations/EscalationChatSection.jsx: EscalationChatSection, AudioCtx
- src/components/finance/FinanceAssetFinancingPage.jsx: FinanceAssetFinancingPage, Stat
- src/components/finance/FinanceComingSoonPage.jsx: FinanceComingSoonPage, FINANCE_PAGE_CONFIG, PREPARATION_CARDS, PageIcon, CardIcon
- src/components/finance/FinanceCustomerSoaPage.jsx: FinanceCustomerSoaPage, Stat
- src/components/finance/FinancePayablesPage.jsx: FinancePayablesPage, AGEING_ORDER, Stat
- src/components/finance/FinanceReceivablesPage.jsx: FinanceReceivablesPage, AGEING_ORDER, Stat
- src/components/finance/FinanceStatementPage.jsx: FinanceStatementPage, REPORT_COPY, StatCard, EmptyState, StatementTable

### React dependency / API chains
- src/App.jsx: used by src/main.jsx · depends on src/components/layout/TopHeader.jsx, src/components/layout/Sidebar.jsx, src/components/dashboard/ExecutiveDashboard.jsx, src/components/fleet/FleetControlTower.jsx, src/components/drivers/DriverControlTower.jsx, src/components/vehicles/VehicleManager.jsx
- src/components/auth/AdminLogin.jsx: depends on src/services/api.js, src/components/common/Icons.jsx
- src/components/auth/AuthPage.jsx: depends on src/services/localStore.js
- src/components/common/AdminOptionSelect.jsx: used by src/components/compliance/ComplianceMasterPage.jsx, src/components/drivers/DriverDocumentsModal.jsx, src/components/escalations/EscalationMasterPage.jsx, src/components/fuel/FuelMasterPage.jsx · depends on src/services/api.js
- src/components/common/Icons.jsx: used by src/components/auth/AdminLogin.jsx, src/components/compliance/ComplianceMasterPage.jsx, src/components/dashboard/ExecutiveDashboard.jsx, src/components/driver-portal/DriverDashboardOverview.jsx
- src/components/compliance/ComplianceMasterPage.jsx: depends on src/components/common/Icons.jsx, src/services/api.js, src/components/common/AdminOptionSelect.jsx
- src/components/dashboard/ExecutiveDashboard.jsx: used by src/App.jsx · depends on src/components/common/Icons.jsx, src/services/api.js
- src/components/driver-portal/DriverDashboardOverview.jsx: used by src/components/driver-portal/DriverPortalShell.jsx · depends on src/components/common/Icons.jsx
- src/components/driver-portal/DriverInvoicesView.jsx: used by src/components/driver-portal/DriverPortalShell.jsx · depends on src/components/common/Icons.jsx, src/services/api.js
- src/components/driver-portal/DriverKycLockerView.jsx: used by src/components/driver-portal/DriverPortalShell.jsx · depends on src/components/common/Icons.jsx
- src/components/driver-portal/DriverPortalShell.jsx: depends on src/components/driver-portal/DriverSidebar.jsx, src/components/driver-portal/DriverTopHeader.jsx, src/components/driver-portal/DriverDashboardOverview.jsx, src/components/driver-portal/DriverKycLockerView.jsx, src/components/driver-portal/DriverWalletView.jsx, src/components/driver-portal/DriverVehicleView.jsx
- src/components/driver-portal/DriverProfileHub.jsx: depends on src/components/common/Icons.jsx
- src/components/driver-portal/DriverShiftsView.jsx: used by src/components/driver-portal/DriverPortalShell.jsx · depends on src/components/common/Icons.jsx
- src/components/driver-portal/DriverSidebar.jsx: used by src/components/driver-portal/DriverPortalShell.jsx · depends on src/components/common/Icons.jsx
- src/components/driver-portal/DriverSupportView.jsx: depends on src/components/common/Icons.jsx
- src/components/driver-portal/DriverTopHeader.jsx: used by src/components/driver-portal/DriverPortalShell.jsx · depends on src/components/common/Icons.jsx
- src/components/driver-portal/DriverVehicleView.jsx: used by src/components/driver-portal/DriverPortalShell.jsx · depends on src/components/common/Icons.jsx
- src/components/driver-portal/DriverWalletView.jsx: used by src/components/driver-portal/DriverPortalShell.jsx · depends on src/components/common/Icons.jsx
- src/components/drivers/AllDriversListPage.jsx: used by src/components/drivers/DriverControlTower.jsx · depends on src/components/common/Icons.jsx, src/services/api.js
- src/components/drivers/DriverControlTower.jsx: used by src/App.jsx · depends on src/components/common/Icons.jsx, src/services/api.js, src/components/drivers/DriverDetailPage.jsx, src/components/drivers/FleetLiveLocationMap.jsx, src/components/drivers/AddDriverPage.jsx, src/components/drivers/AllDriversListPage.jsx
- src/components/drivers/DriverDocumentsModal.jsx: depends on src/components/common/Icons.jsx, src/services/api.js, src/components/common/AdminOptionSelect.jsx, src/components/common/DocumentOcrScannerModal.jsx
- src/components/drivers/FleetLiveLocationMap.jsx: used by src/components/drivers/DriverControlTower.jsx · depends on src/components/common/Icons.jsx
- src/components/drivers/StatutoryCertificateViewerModal.jsx: depends on src/components/common/Icons.jsx, src/services/api.js
- src/components/escalations/EscalationChatSection.jsx: used by src/components/escalations/EscalationMasterPage.jsx · depends on src/components/common/Icons.jsx, src/services/api.js
- src/components/escalations/EscalationMasterPage.jsx: depends on src/components/common/Icons.jsx, src/components/common/DocumentOcrScannerModal.jsx, src/services/api.js, src/components/escalations/EscalationChatSection.jsx, src/components/common/AdminOptionSelect.jsx
- src/components/finance/FinanceAssetFinancingPage.jsx: depends on src/components/common/Icons.jsx, src/services/api.js
- src/components/finance/FinanceComingSoonPage.jsx: depends on src/components/common/Icons.jsx
- src/components/finance/FinanceCustomerSoaPage.jsx: depends on src/components/common/Icons.jsx, src/services/api.js
- src/components/finance/FinancePayablesPage.jsx: depends on src/components/common/Icons.jsx, src/services/api.js
- src/components/finance/FinanceReceivablesPage.jsx: depends on src/components/common/Icons.jsx, src/services/api.js

### Node route / backend symbols
- src/services/api.js: fetchAdminOptionsApi, createAdminOptionApi, loginAdminApi, checkDriverEmailApi, registerDriverApi, loginDriverApi, getCachedDriverUser, logoutDriverApi, fetchDriverProfileApi, fetchDashboardApi, fetchFinanceReportApi, fetchReceivablesApi
- src/services/localStore.js: getRegisteredUsers, registerUser, authenticateUser, getCurrentUser, logoutUser, getDashboardData
- server/routes/assignmentRoutes.js: GET /, POST /, POST /:id/revert, POST /:id/extend, readJson, writeJson, syncAndExpireAssignments, newVehStatus, isAlreadyAllocated, asgIndex, assignment
- server/routes/authRoutes.js: POST /login, GET /me, POST /driver/check-email, POST /driver/register, POST /driver/login, GET /driver/me, getAdminData, getDriversData, saveDriversData, getDriverLease, getDriverInvoices, getDriverTodayVehicle
- server/routes/complianceRoutes.js: GET /, POST /document, PUT /document/:id/renew, POST /challan, POST /challan/:id/pay, PUT /challan/:id/deduct-wallet, getComplianceData, saveComplianceData, calculateComplianceKpis, updateComplianceKpis, docCount, challanCount
- server/routes/dashboardRoutes.js: GET /, POST /quick-action, getDashboardData
- server/routes/driverRoutes.js: GET /, GET /wallet-health, GET /:id, PUT /:id, PUT /:id/status, POST /:id/wallet/topup, POST /, PUT /:id/vehicle, readDriversData, writeDriversData, unassignVehicleInFleet, syncVehicleAssignmentInFleet
- server/routes/escalationRoutes.js: GET /, GET /:id, POST /, POST /:id/notes, GET /:id/messages, POST /:id/messages, PUT /:id, POST /:id/resolve, getEscalationsData, saveEscalationsData, updateKpiCounts, ensureTicketMessages
- server/routes/financeRoutes.js: GET /receivables, GET /customer-soa/:customerKey, GET /payables, GET /asset-financing, GET /reports/:reportType, readJson, amount, parseDate, dateKey, startOfDay, endOfDay, inPeriod
- server/routes/fleetRoutes.js: GET /, GET /vehicles/:id, POST /vehicles, PUT /vehicles/:id, PUT /vehicles/:id/status, POST /vehicles/:id/action, DELETE /vehicles/:id, getFleetData, saveFleetData, unassignDriverInDriversData, matchedDriver, moneyValue
- server/routes/fuelRoutes.js: GET /, POST /session/start, POST /session/:id/stop, POST /session/:id/settle, POST /log, PUT /log/:id/verify, getFuelData, saveFuelData, updateFuelKpis, activeSessions, _settledSessions, totalKwh
- server/routes/maintenanceRoutes.js: GET /, GET /:id, POST /job-cards, PATCH /:id/advance-stage, POST /:id/estimate, POST /:id/qc, POST /:id/bill, POST /:id/payment, getMaintenanceData, saveMaintenanceData, updateMaintKpis
- server/routes/ocrRoutes.js: POST /gemini, GET /status, extractBase64
- server/routes/optionsRoutes.js: GET /, POST /, readLocalOptions, writeLocalOptions, normalizeGroup, normalizeOption, localOptionsFor, ensureOptionsSchema, seedGroup
- server/routes/rapidoRoutes.js: PUT /on_order_status, PUT /on_order_status/:orderId, PUT /prod/on_order_status, PUT /prod/on_order_status/:orderId, PUT /staging/on_order_status, PUT /staging/on_order_status/:orderId, PUT /stage/on_order_status, PUT /stage/on_order_status/:orderId, verifyRapidoApiKey, formatLocationString, handleOrderStatus
- server/routes/rentalRoutes.js: GET /leases, GET /leases/:id, POST /leases, POST /leases/:id/sign, POST /leases/:id/deposit, POST /leases/:id/activate, GET /invoices, POST /invoices, readJson, writeJson, syncDriverFromLease, recalculateInvoiceSummaries
- server/routes/tripRoutes.js: GET /, GET /:id, POST /, POST /import, PATCH /:id/status, POST /:id/escalate, getTripsData, saveTripsData, updateKpiCounts, nextIdx
- server.js: GET /api/health, GET /api/db-status, USE /api/auth, USE /api/dashboard, USE /api/fleet, USE /api/drivers, USE /api/assignments, USE /api/rentals

### Node route -> handler graph
- server/routes/assignmentRoutes.js: GET / -> handler, POST / -> handler, POST /:id/revert -> handler, POST /:id/extend -> handler
- server/routes/authRoutes.js: POST /login -> handler, GET /me -> handler, POST /driver/check-email -> handler, POST /driver/register -> handler, POST /driver/login -> handler, GET /driver/me -> handler
- server/routes/complianceRoutes.js: GET / -> handler, POST /document -> handler, PUT /document/:id/renew -> handler, POST /challan -> handler, POST /challan/:id/pay -> handler, PUT /challan/:id/deduct-wallet -> handler
- server/routes/dashboardRoutes.js: GET / -> handler, POST /quick-action -> handler
- server/routes/driverRoutes.js: GET / -> handler, GET /wallet-health -> handler, GET /:id -> handler, PUT /:id -> handler, PUT /:id/status -> handler, POST /:id/wallet/topup -> handler, POST / -> handler, PUT /:id/vehicle -> handler, PUT /:id/today-vehicle -> handler, PUT /:id/lease -> handler, POST /:id/leave -> handler, PUT /:id/deal -> handler, GET /:id/documents -> handler, DELETE /:id -> handler, POST /:id/documents -> handler, PUT /:id/documents/:docId -> handler, DELETE /:id/documents/:docId -> handler
- server/routes/escalationRoutes.js: GET / -> handler, GET /:id -> handler, POST / -> handler, POST /:id/notes -> handler, GET /:id/messages -> handler, POST /:id/messages -> handler, PUT /:id -> handler, POST /:id/resolve -> handler
- server/routes/financeRoutes.js: GET /receivables -> handler, GET /customer-soa/:customerKey -> handler, GET /payables -> handler, GET /asset-financing -> handler, GET /reports/:reportType -> handler
- server/routes/fleetRoutes.js: GET / -> handler, GET /vehicles/:id -> handler, POST /vehicles -> handler, PUT /vehicles/:id -> handler, PUT /vehicles/:id/status -> handler, POST /vehicles/:id/action -> handler, DELETE /vehicles/:id -> handler
- server/routes/fuelRoutes.js: GET / -> handler, POST /session/start -> handler, POST /session/:id/stop -> handler, POST /session/:id/settle -> handler, POST /log -> handler, PUT /log/:id/verify -> handler
- server/routes/maintenanceRoutes.js: GET / -> handler, GET /:id -> handler, POST /job-cards -> handler, PATCH /:id/advance-stage -> handler, POST /:id/estimate -> handler, POST /:id/qc -> handler, POST /:id/bill -> handler, POST /:id/payment -> handler, POST /:id/release -> handler
- server/routes/ocrRoutes.js: POST /gemini -> handler, GET /status -> handler
- server/routes/optionsRoutes.js: GET / -> handler, POST / -> handler
- server/routes/rapidoRoutes.js: PUT /on_order_status -> handler, PUT /on_order_status/:orderId -> handler, PUT /prod/on_order_status -> handler, PUT /prod/on_order_status/:orderId -> handler, PUT /staging/on_order_status -> handler, PUT /staging/on_order_status/:orderId -> handler, PUT /stage/on_order_status -> handler, PUT /stage/on_order_status/:orderId -> handler, GET /integration-status -> handler
- server/routes/rentalRoutes.js: GET /leases -> handler, GET /leases/:id -> handler, POST /leases -> handler, POST /leases/:id/sign -> handler, POST /leases/:id/deposit -> handler, POST /leases/:id/activate -> handler, GET /invoices -> handler, POST /invoices -> handler, POST /invoices/:id/pay-wallet -> handler, POST /invoices/:id/pay-direct -> handler, POST /invoices/:id/waive -> handler
- server/routes/tripRoutes.js: GET / -> handler, GET /:id -> handler, POST / -> handler, POST /import -> handler, PATCH /:id/status -> handler, POST /:id/escalate -> handler
- server.js: GET /api/health -> handler, GET /api/db-status -> handler

### Database drivers
- MySQL/mysql2

### Database / connection files
- server/config/db.js

### Database table/query hints
- server/config/db.js: mysql2, dotenv, path, url, project, mysql

### Frontend API contracts
- src/services/api.js: GET /${API_BASE}/options
- src/services/api.js: POST /${API_BASE}/options
- src/services/api.js: POST /${API_BASE}/auth/login
- src/services/api.js: POST /${API_BASE}/auth/driver/check-email
- src/services/api.js: POST /${API_BASE}/auth/driver/register
- src/services/api.js: POST /${API_BASE}/auth/driver/login
- src/services/api.js: GET /${API_BASE}/dashboard
- src/services/api.js: GET /${API_BASE}/finance/customer-soa/${encodeURIComponent(customerKey)}
- src/services/api.js: GET /${API_BASE}/fleet/vehicles/${encodeURIComponent(vehicleId)}
- src/services/api.js: POST /${API_BASE}/fleet/vehicles/${encodeURIComponent(vehicleId)}/action
- src/services/api.js: POST /${API_BASE}/fleet/vehicles
- src/services/api.js: PUT /${API_BASE}/fleet/vehicles/${encodeURIComponent(vehicleId)}
- src/services/api.js: PUT /${API_BASE}/fleet/vehicles/${encodeURIComponent(vehicleId)}/status
- src/services/api.js: DELETE /${API_BASE}/fleet/vehicles/${encodeURIComponent(vehicleId)}
- src/services/api.js: GET /${API_BASE}/drivers/${encodeURIComponent(id)}
- src/services/api.js: PUT /${API_BASE}/drivers/${encodeURIComponent(id)}
- src/services/api.js: PUT /${API_BASE}/drivers/${encodeURIComponent(id)}/status
- src/services/api.js: POST /${API_BASE}/drivers/${encodeURIComponent(id)}/wallet/topup
- src/services/api.js: POST /${API_BASE}/drivers
- src/services/api.js: DELETE /${API_BASE}/drivers/${encodeURIComponent(id)}
- src/services/api.js: PUT /${API_BASE}/drivers/${encodeURIComponent(driverId)}/vehicle
- src/services/api.js: PUT /${API_BASE}/drivers/${encodeURIComponent(driverId)}/today-vehicle
- src/services/api.js: GET /${API_BASE}/rentals/invoices
- src/services/api.js: PUT /${API_BASE}/drivers/${encodeURIComponent(driverId)}/lease

### Backend API contracts
- server/routes/assignmentRoutes.js: GET / -> handler
- server/routes/assignmentRoutes.js: POST / -> handler
- server/routes/assignmentRoutes.js: POST /:id/revert -> handler
- server/routes/assignmentRoutes.js: POST /:id/extend -> handler
- server/routes/authRoutes.js: POST /login -> handler
- server/routes/authRoutes.js: GET /me -> handler
- server/routes/authRoutes.js: POST /driver/check-email -> handler
- server/routes/authRoutes.js: POST /driver/register -> handler
- server/routes/authRoutes.js: POST /driver/login -> handler
- server/routes/authRoutes.js: GET /driver/me -> handler
- server/routes/complianceRoutes.js: GET / -> handler
- server/routes/complianceRoutes.js: POST /document -> handler
- server/routes/complianceRoutes.js: PUT /document/:id/renew -> handler
- server/routes/complianceRoutes.js: POST /challan -> handler
- server/routes/complianceRoutes.js: POST /challan/:id/pay -> handler
- server/routes/complianceRoutes.js: PUT /challan/:id/deduct-wallet -> handler
- server/routes/dashboardRoutes.js: GET / -> handler
- server/routes/dashboardRoutes.js: POST /quick-action -> handler
- server/routes/driverRoutes.js: GET / -> handler
- server/routes/driverRoutes.js: GET /wallet-health -> handler
- server/routes/driverRoutes.js: GET /:id -> handler
- server/routes/driverRoutes.js: PUT /:id -> handler
- server/routes/driverRoutes.js: PUT /:id/status -> handler
- server/routes/driverRoutes.js: POST /:id/wallet/topup -> handler
- server/routes/driverRoutes.js: POST / -> handler
- server/routes/driverRoutes.js: PUT /:id/vehicle -> handler
- server/routes/driverRoutes.js: PUT /:id/today-vehicle -> handler
- server/routes/driverRoutes.js: PUT /:id/lease -> handler

### Safe runtime configuration hints
- server/config/db.js: MySQL · env DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
- server/config/operationalStore.js: MySQL
- server.js: MySQL · env PORT

### Frontend routes
- server/routes/assignmentRoutes.js
- server/routes/authRoutes.js
- server/routes/complianceRoutes.js
- server/routes/dashboardRoutes.js
- server/routes/driverRoutes.js
- server/routes/escalationRoutes.js
- server/routes/financeRoutes.js
- server/routes/fleetRoutes.js
- server/routes/fuelRoutes.js
- server/routes/maintenanceRoutes.js
- server/routes/ocrRoutes.js
- server/routes/optionsRoutes.js
- server/routes/rapidoRoutes.js
- server/routes/rentalRoutes.js
- server/routes/tripRoutes.js

### API / client services
- src/services/api.js
- src/services/localStore.js

### Styles
- src/App.css
- src/components/landing/LandingPage.css
- src/index.css

### Node routes
- server/routes/assignmentRoutes.js
- server/routes/authRoutes.js
- server/routes/complianceRoutes.js
- server/routes/dashboardRoutes.js
- server/routes/driverRoutes.js
- server/routes/escalationRoutes.js
- server/routes/financeRoutes.js
- server/routes/fleetRoutes.js
- server/routes/fuelRoutes.js
- server/routes/maintenanceRoutes.js
- server/routes/ocrRoutes.js
- server/routes/optionsRoutes.js
- server/routes/rapidoRoutes.js
- server/routes/rentalRoutes.js
- server/routes/tripRoutes.js
- server.js

### Services / actions
- src/services/api.js
- src/services/localStore.js

### Available validation scripts
- dev: concurrently -k -n "BACKEND,FRONTEND" -c "cyan,magenta" "node --watch server/index.js" "vite"
- start: node server.js
- build: vite build
- lint: oxlint
- preview: vite preview

### Local dependency hints
- src/App.jsx -> src/components/layout/TopHeader.jsx, src/components/layout/Sidebar.jsx, src/components/dashboard/ExecutiveDashboard.jsx, src/components/fleet/FleetControlTower.jsx, src/components/drivers/DriverControlTower.jsx, src/components/vehicles/VehicleManager.jsx, src/components/rentals/BookingLeasePage.jsx, src/components/rentals/InvoicesPage.jsx
- src/components/auth/AdminLogin.jsx -> src/servi
