# Technomantra Project Memory

> This is a persistent locator map, not a claim that file contents are current. Read each target only once per task and rely on normal invalidation after edits.

- Workspace: SIKHAR Nodejs app
- Technology: React, Vite, Express, MySQL, Node.js/npm
- Active file at refresh: None
- Local code graph: 66 files · 243 edges · 0 matched flows
- Refreshed: 2026-11-03T09:01:08.096Z

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
- src/components/common/DocumentOcrScannerModal.jsx
- src/components/common/Icons.jsx
- src/components/compliance/ComplianceMasterPage.jsx
- src/components/dashboard/ExecutiveDashboard.jsx
- src/components/dashboard/ModuleViewer.jsx
- src/components/drivers/AddDriverPage.jsx
- src/components/drivers/AllDriversListPage.jsx
- src/components/drivers/DriverControlTower.jsx
- src/components/drivers/DriverDetailPage.jsx
- src/components/drivers/DriverDocumentsModal.jsx
- src/components/drivers/FleetLiveLocationMap.jsx
- src/components/drivers/StatutoryCertificateViewerModal.jsx
- src/components/escalations/EscalationChatSection.jsx
- src/components/escalations/EscalationMasterPage.jsx

### React component symbols
- src/App.jsx: App
- src/components/auth/AdminLogin.jsx: AdminLogin
- src/components/auth/AuthPage.jsx: AuthPage
- src/components/common/Icons.jsx: Compass, Home, Truck, Bus, Wrench
- src/components/compliance/ComplianceMasterPage.jsx: ComplianceMasterPage
- src/components/dashboard/ExecutiveDashboard.jsx: ExecutiveDashboard
- src/components/dashboard/ModuleViewer.jsx: ModuleViewer
- src/components/drivers/AllDriversListPage.jsx: AllDriversListPage
- src/components/drivers/DriverControlTower.jsx: DriverControlTower
- src/components/drivers/DriverDocumentsModal.jsx: DriverDocumentsModal, DOCUMENT_CATEGORIES
- src/components/drivers/FleetLiveLocationMap.jsx: FleetLiveLocationMap, FLEET_GPS_TELEMETRY
- src/components/drivers/StatutoryCertificateViewerModal.jsx: StatutoryCertificateViewerModal, AshokEmblem, SmartCardChip, SpecimenQrCode, CATEGORY_TABS
- src/components/escalations/EscalationChatSection.jsx: EscalationChatSection, AudioCtx
- src/components/fleet/FleetControlTower.jsx: FleetControlTower
- src/components/fuel/FuelMasterPage.jsx: FuelMasterPage
- src/components/landing/LandingPage.jsx: LandingPage, BrandMark, Icon
- src/components/layout/Sidebar.jsx: Sidebar, MENU_SECTIONS, Icon, SubIcon
- src/components/layout/TopHeader.jsx: TopHeader
- src/components/rentals/CommercialLeaseAgreementPreviewModal.jsx: CommercialLeaseAgreementPreviewModal
- src/components/rentals/GenerateInvoicePage.jsx: GenerateInvoicePage
- src/components/rentals/InvoiceDetailPage.jsx: InvoiceDetailPage
- src/components/rentals/InvoicesPage.jsx: InvoicesPage
- src/components/trips/TripsMasterPage.jsx: TripsMasterPage
- src/components/vehicles/AddVehiclePage.jsx: AddVehiclePage
- src/components/vehicles/SpeedometerTelemetryCard.jsx: SpeedometerTelemetryCard
- src/components/vehicles/VehicleAssignmentPage.jsx: VehicleAssignmentPage
- src/components/vehicles/VehicleDetailPage.jsx: VehicleDetailPage
- src/components/vehicles/VehicleManager.jsx: VehicleManager
- src/components/vehicles/VehicleMasterPage.jsx: VehicleMasterPage
- src/components/wallet/WalletHealthPage.jsx: WalletHealthPage

### React dependency / API chains
- src/App.jsx: used by src/main.jsx · depends on src/components/layout/TopHeader.jsx, src/components/layout/Sidebar.jsx, src/components/dashboard/ExecutiveDashboard.jsx, src/components/fleet/FleetControlTower.jsx, src/components/drivers/DriverControlTower.jsx, src/components/vehicles/VehicleManager.jsx
- src/components/auth/AdminLogin.jsx: depends on src/services/api.js, src/components/common/Icons.jsx
- src/components/auth/AuthPage.jsx: depends on src/services/localStore.js
- src/components/common/Icons.jsx: used by src/components/auth/AdminLogin.jsx, src/components/compliance/ComplianceMasterPage.jsx, src/components/dashboard/ExecutiveDashboard.jsx, src/components/drivers/AllDriversListPage.jsx
- src/components/compliance/ComplianceMasterPage.jsx: depends on src/components/common/Icons.jsx, src/services/api.js
- src/components/dashboard/ExecutiveDashboard.jsx: used by src/App.jsx · depends on src/components/common/Icons.jsx, src/services/api.js
- src/components/drivers/AllDriversListPage.jsx: used by src/components/drivers/DriverControlTower.jsx · depends on src/components/common/Icons.jsx, src/services/api.js
- src/components/drivers/DriverControlTower.jsx: used by src/App.jsx · depends on src/components/common/Icons.jsx, src/services/api.js, src/components/drivers/DriverDetailPage.jsx, src/components/drivers/FleetLiveLocationMap.jsx, src/components/drivers/AddDriverPage.jsx, src/components/drivers/AllDriversListPage.jsx
- src/components/drivers/DriverDocumentsModal.jsx: depends on src/components/common/Icons.jsx, src/services/api.js, src/components/common/DocumentOcrScannerModal.jsx
- src/components/drivers/FleetLiveLocationMap.jsx: used by src/components/drivers/DriverControlTower.jsx · depends on src/components/common/Icons.jsx
- src/components/drivers/StatutoryCertificateViewerModal.jsx: depends on src/components/common/Icons.jsx, src/services/api.js
- src/components/escalations/EscalationChatSection.jsx: used by src/components/escalations/EscalationMasterPage.jsx · depends on src/components/common/Icons.jsx, src/services/api.js
- src/components/escalations/EscalationMasterPage.jsx: depends on src/components/common/Icons.jsx, src/components/common/DocumentOcrScannerModal.jsx, src/services/api.js, src/components/escalations/EscalationChatSection.jsx
- src/components/fleet/FleetControlTower.jsx: used by src/App.jsx · depends on src/components/common/Icons.jsx, src/services/api.js
- src/components/fuel/FuelMasterPage.jsx: depends on src/components/common/Icons.jsx, src/components/common/DocumentOcrScannerModal.jsx, src/services/api.js
- src/components/landing/LandingPage.jsx: depends on src/components/common/Icons.jsx, src/components/landing/LandingPage.css
- src/components/layout/Sidebar.jsx: used by src/App.jsx · depends on src/components/common/Icons.jsx
- src/components/layout/TopHeader.jsx: used by src/App.jsx · depends on src/components/common/Icons.jsx
- src/components/maintenance/MaintenanceMasterPage.jsx: depends on src/components/common/Icons.jsx, src/components/common/DocumentOcrScannerModal.jsx, src/services/api.js
- src/components/rentals/CommercialLeaseAgreementPreviewModal.jsx: depends on src/components/common/Icons.jsx
- src/components/rentals/GenerateInvoicePage.jsx: depends on src/components/common/Icons.jsx, src/services/api.js
- src/components/rentals/InvoiceDetailPage.jsx: depends on src/components/common/Icons.jsx, src/services/api.js
- src/components/rentals/InvoicesPage.jsx: used by src/App.jsx · depends on src/components/common/Icons.jsx, src/services/api.js
- src/components/trips/TripsMasterPage.jsx: depends on src/components/common/Icons.jsx, src/services/api.js
- src/components/vehicles/AddVehiclePage.jsx: used by src/components/vehicles/VehicleManager.jsx · depends on src/components/common/Icons.jsx, src/components/common/DocumentOcrScannerModal.jsx, src/services/api.js
- src/components/vehicles/SpeedometerTelemetryCard.jsx: used by src/components/vehicles/VehicleDetailPage.jsx · depends on src/components/common/Icons.jsx
- src/components/vehicles/VehicleAssignmentPage.jsx: used by src/components/vehicles/VehicleManager.jsx · depends on src/components/common/Icons.jsx, src/services/api.js
- src/components/vehicles/VehicleDetailPage.jsx: used by src/components/vehicles/VehicleManager.jsx · depends on src/components/common/Icons.jsx, src/services/api.js, src/components/vehicles/SpeedometerTelemetryCard.jsx
- src/components/vehicles/VehicleManager.jsx: used by src/App.jsx · depends on src/components/vehicles/VehicleMasterPage.jsx, src/components/vehicles/VehicleDetailPage.jsx, src/components/vehicles/AddVehiclePage.jsx, src/components/vehicles/VehicleAssignmentPage.jsx
- src/components/vehicles/VehicleMasterPage.jsx: used by src/components/vehicles/VehicleManager.jsx · depends on src/components/common/Icons.jsx, src/services/api.js

### Node route / backend symbols
- src/services/api.js: loginAdminApi, fetchDashboardApi, fetchFleetTowerApi, fetchVehicleDetailApi, executeVehicleActionApi, createVehicleApi, updateVehicleStatusApi, fetchDriversApi, fetchDriverByIdApi, updateDriverStatusApi, topupDriverWalletApi, fetchWalletHealthApi
- src/services/localStore.js: getRegisteredUsers, registerUser, authenticateUser, getCurrentUser, logoutUser, getDashboardData
- server/routes/assignmentRoutes.js: GET /, POST /, POST /:id/revert, POST /:id/extend, readJson, writeJson, syncAndExpireAssignments, newVehStatus, isAlreadyAllocated, asgIndex, assignment
- server/routes/authRoutes.js: POST /login, GET /me, getAdminData
- server/routes/complianceRoutes.js: GET /, POST /document, PUT /document/:id/renew, POST /challan, POST /challan/:id/pay, PUT /challan/:id/deduct-wallet, getComplianceData, saveComplianceData, updateComplianceKpis, docCount, challanCount
- server/routes/dashboardRoutes.js: GET /, POST /quick-action, getDashboardData
- server/routes/driverRoutes.js: GET /, GET /wallet-health, GET /:id, PUT /:id/status, POST /:id/wallet/topup, POST /, PUT /:id/vehicle, POST /:id/leave, readDriversData, writeDriversData, unassignVehicleInFleet, isTransactionToday
- server/routes/escalationRoutes.js: GET /, GET /:id, POST /, POST /:id/notes, GET /:id/messages, POST /:id/messages, PUT /:id, POST /:id/resolve, getEscalationsData, saveEscalationsData, updateKpiCounts, ensureTicketMessages
- server/routes/fleetRoutes.js: GET /, GET /vehicles/:id, POST /vehicles, PUT /vehicles/:id/status, POST /vehicles/:id/action, getFleetData, saveFleetData
- server/routes/fuelRoutes.js: GET /, POST /session/start, POST /session/:id/stop, POST /session/:id/settle, POST /log, PUT /log/:id/verify, getFuelData, saveFuelData, updateFuelKpis, activeSessions, settledSessions, totalKwh
- server/routes/maintenanceRoutes.js: GET /, GET /:id, POST /job-cards, PATCH /:id/advance-stage, POST /:id/estimate, POST /:id/qc, POST /:id/bill, POST /:id/payment, getMaintenanceData, saveMaintenanceData, updateMaintKpis
- server/routes/ocrRoutes.js: POST /gemini, GET /status, extractBase64
- server/routes/rapidoRoutes.js: PUT /on_order_status/:orderId, GET /integration-status, verifyRapidoApiKey
- server/routes/rentalRoutes.js: GET /leases, GET /leases/:id, POST /leases, POST /leases/:id/sign, POST /leases/:id/deposit, POST /leases/:id/activate, GET /invoices, POST /invoices, readJson, writeJson, lease, matchedDriver
- server/routes/tripRoutes.js: GET /, GET /:id, POST /, POST /import, PATCH /:id/status, POST /:id/escalate, getTripsData, saveTripsData, updateKpiCounts, nextIdx
- server.js: GET /api/health, GET /api/db-status, USE /api/auth, USE /api/dashboard, USE /api/fleet, USE /api/drivers, USE /api/assignments, USE /api/rentals

### Node route -> handler graph
- server/routes/assignmentRoutes.js: GET / -> handler, POST / -> handler, POST /:id/revert -> handler, POST /:id/extend -> handler
- server/routes/authRoutes.js: POST /login -> handler, GET /me -> handler
- server/routes/complianceRoutes.js: GET / -> handler, POST /document -> handler, PUT /document/:id/renew -> handler, POST /challan -> handler, POST /challan/:id/pay -> handler, PUT /challan/:id/deduct-wallet -> handler
- server/routes/dashboardRoutes.js: GET / -> handler, POST /quick-action -> handler
- server/routes/driverRoutes.js: GET / -> handler, GET /wallet-health -> handler, GET /:id -> handler, PUT /:id/status -> handler, POST /:id/wallet/topup -> handler, POST / -> handler, PUT /:id/vehicle -> handler, POST /:id/leave -> handler, PUT /:id/deal -> handler, GET /:id/documents -> handler, DELETE /:id -> handler, POST /:id/documents -> handler, PUT /:id/documents/:docId -> handler, DELETE /:id/documents/:docId -> handler
- server/routes/escalationRoutes.js: GET / -> handler, GET /:id -> handler, POST / -> handler, POST /:id/notes -> handler, GET /:id/messages -> handler, POST /:id/messages -> handler, PUT /:id -> handler, POST /:id/resolve -> handler
- server/routes/fleetRoutes.js: GET / -> handler, GET /vehicles/:id -> handler, POST /vehicles -> handler, PUT /vehicles/:id/status -> handler, POST /vehicles/:id/action -> handler
- server/routes/fuelRoutes.js: GET / -> handler, POST /session/start -> handler, POST /session/:id/stop -> handler, POST /session/:id/settle -> handler, POST /log -> handler, PUT /log/:id/verify -> handler
- server/routes/maintenanceRoutes.js: GET / -> handler, GET /:id -> handler, POST /job-cards -> handler, PATCH /:id/advance-stage -> handler, POST /:id/estimate -> handler, POST /:id/qc -> handler, POST /:id/bill -> handler, POST /:id/payment -> handler, POST /:id/release -> handler
- server/routes/ocrRoutes.js: POST /gemini -> handler, GET /status -> handler
- server/routes/rapidoRoutes.js: PUT /on_order_status/:orderId -> verifyRapidoApiKey, GET /integration-status -> handler
- server/routes/rentalRoutes.js: GET /leases -> handler, GET /leases/:id -> handler, POST /leases -> handler, POST /leases/:id/sign -> handler, POST /leases/:id/deposit -> handler, POST /leases/:id/activate -> handler, GET /invoices -> handler, POST /invoices -> handler, POST /invoices/:id/pay-wallet -> handler, POST /invoices/:id/pay-direct -> handler, POST /invoices/:id/waive -> handler
- server/routes/tripRoutes.js: GET / -> handler, GET /:id -> handler, POST / -> handler, POST /import -> handler, PATCH /:id/status -> handler, POST /:id/escalate -> handler
- server.js: GET /api/health -> handler, GET /api/db-status -> handler

### Node handler/service/DB chains
- server.js -> server/routes/authRoutes.js, server/routes/dashboardRoutes.js, server/routes/fleetRoutes.js, server/routes/driverRoutes.js, server/routes/assignmentRoutes.js, server/routes/rentalRoutes.js, server/routes/escalationRoutes.js

### Database drivers
- MySQL/mysql2

### Database / connection files
- server/config/db.js

### Database table/query hints
- server/config/db.js: mysql2, dotenv, path, url, project, mysql

### Frontend API contracts
- src/services/api.js: POST /${API_BASE}/auth/login
- src/services/api.js: GET /${API_BASE}/dashboard
- src/services/api.js: GET /${API_BASE}/fleet/vehicles/${encodeURIComponent(vehicleId)}
- src/services/api.js: POST /${API_BASE}/fleet/vehicles/${encodeURIComponent(vehicleId)}/action
- src/services/api.js: POST /${API_BASE}/fleet/vehicles
- src/services/api.js: PUT /${API_BASE}/fleet/vehicles/${encodeURIComponent(vehicleId)}/status
- src/services/api.js: GET /${API_BASE}/drivers/${encodeURIComponent(id)}
- src/services/api.js: PUT /${API_BASE}/drivers/${encodeURIComponent(id)}/status
- src/services/api.js: POST /${API_BASE}/drivers/${encodeURIComponent(id)}/wallet/topup
- src/services/api.js: POST /${API_BASE}/drivers
- src/services/api.js: DELETE /${API_BASE}/drivers/${encodeURIComponent(id)}
- src/services/api.js: PUT /${API_BASE}/drivers/${encodeURIComponent(driverId)}/vehicle
- src/services/api.js: POST /${API_BASE}/drivers/${encodeURIComponent(driverId)}/leave
- src/services/api.js: PUT /${API_BASE}/drivers/${encodeURIComponent(driverId)}/deal
- src/services/api.js: GET /${API_BASE}/drivers/${encodeURIComponent(driverId)}/documents
- src/services/api.js: POST /${API_BASE}/drivers/${encodeURIComponent(driverId)}/documents
- src/services/api.js: PUT /${API_BASE}/drivers/${encodeURIComponent(driverId)}/documents/${encodeURIComponent(docId)}
- src/services/api.js: DELETE /${API_BASE}/drivers/${encodeURIComponent(driverId)}/documents/${encodeURIComponent(docId)}
- src/services/api.js: GET /${API_BASE}/assignments
- src/services/api.js: POST /${API_BASE}/assignments
- src/services/api.js: POST /${API_BASE}/assignments/${encodeURIComponent(assignmentId)}/revert
- src/services/api.js: POST /${API_BASE}/assignments/${encodeURIComponent(assignmentId)}/extend
- src/services/api.js: GET /${API_BASE}/rentals/leases/${encodeURIComponent(id)}
- src/services/api.js: POST /${API_BASE}/rentals/leases

### Backend API contracts
- server/routes/assignmentRoutes.js: GET / -> handler
- server/routes/assignmentRoutes.js: POST / -> handler
- server/routes/assignmentRoutes.js: POST /:id/revert -> handler
- server/routes/assignmentRoutes.js: POST /:id/extend -> handler
- server/routes/authRoutes.js: POST /login -> handler
- server/routes/authRoutes.js: GET /me -> handler
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
- server/routes/driverRoutes.js: PUT /:id/status -> handler
- server/routes/driverRoutes.js: POST /:id/wallet/topup -> handler
- server/routes/driverRoutes.js: POST / -> handler
- server/routes/driverRoutes.js: PUT /:id/vehicle -> handler
- server/routes/driverRoutes.js: POST /:id/leave -> handler
- server/routes/driverRoutes.js: PUT /:id/deal -> handler
- server/routes/driverRoutes.js: GET /:id/documents -> handler
- server/routes/driverRoutes.js: DELETE /:id -> handler
- server/routes/driverRoutes.js: POST /:id/documents -> handler
- server/routes/driverRoutes.js: PUT /:id/documents/:docId -> handler
- server/routes/driverRoutes.js: DELETE /:id/documents/:docId -> handler

### Safe runtime configuration hints
- server/config/db.js: MySQL · env DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
- server.js: MySQL · env PORT

### Frontend routes
- server/routes/assignmentRoutes.js
- server/routes/authRoutes.js
- server/routes/complianceRoutes.js
- server/routes/dashboardRoutes.js
- server/routes/driverRoutes.js
- server/routes/escalationRoutes.js
- server/routes/fleetRoutes.js
- server/routes/fuelRoutes.js
- server/routes/maintenanceRoutes.js
- server/routes/ocrRoutes.js
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
- server/routes/fleetRoutes.js
- server/routes/fuelRoutes.js
- server/routes/maintenanceRoutes.js
- server/routes/ocrRoutes.js
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
- src/components/auth/AdminLogin.jsx -> src/services/api.js, src/components/common/Icons.jsx
- src/components/auth/AuthPage.jsx -> src/services/localStore.js
- src/components/compliance/ComplianceMasterPage.jsx -> src/components/common/Icons.jsx, src/services/api.js
- src/components/dashboard/ExecutiveDashboard.jsx -> src/components/common/Icons.jsx, src/services/api.js
- src/components/drivers/AllDriversListPage.jsx -> src/components/common/Icons.jsx, src/services/api.js
- src/components/drivers/DriverControlTower.jsx -> src/components/common/Icons.jsx, src/services/api.js, src/components/drivers/DriverDetailPage.jsx, src/components/drivers/FleetLiveLocationMap.jsx, src/components/drivers/AddDriverPage.jsx, src/components/drivers/AllDriversListPage.jsx
- src/components/drivers/DriverDocumentsModal.jsx -> src/components/common/Icons.jsx, src/services/api.js, src/components/common/DocumentOcrScannerModal.jsx
- src/components/drivers/FleetLiveLocationMap.jsx -> src/components/common/Icons.jsx
- src/components/drivers/StatutoryCertificateViewerModal.jsx -> src/components/common/Icons.jsx, src/services/api.js
- src/components/escalations/EscalationChatSection.jsx -> src/components/common/Icons.jsx, src/services/api.js
- src/components/escalations/EscalationMasterPage.jsx -> src/components/common/Icons.jsx, src/components/common/DocumentOcrScannerModal.jsx, src/services/api.js, src/components/escalations/EscalationChatSection.jsx
- src/components/fleet/FleetControlTower.jsx -> src/components/common/Icons.jsx, src/services/api.js
- src/components/fuel/FuelMasterPage.jsx -> src/components/common/Icons.jsx, src/components/common/DocumentOcrScannerModal.jsx, src/services/api.js
- src/components/landing/LandingPage.jsx -> src/components/common/Icons.jsx, src/components/landing/LandingPage.css
- src/components/layout/Sidebar.jsx -> src/components/common/Icons.jsx
- src/components/layout/TopHeader.jsx -> src/components/common/Icons.jsx
- src/components/maintenance/MaintenanceMasterPage.jsx -> src/components/common/Icons.jsx, src/
