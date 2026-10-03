import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import {
  AdminRoute,
  DonorRoute,
  HomeRedirect,
  ManagerRoute,
  OperationalRoute,
  ProtectedRoute,
  PublicRoute,
  ReliefManagerRoute,
  ShelterManagerRoute,
  VolunteerRoute,
} from '../components/ProtectedRoute';
import { BootScreen } from '../components/ui/Feedback';
import MainLayout from '../layouts/MainLayout';
import WelcomePage from '../pages/WelcomePage';
import { ROLES } from '../utils/constants';

// Route-level code splitting keeps the landing page fast
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const AdminDashboard = lazy(() => import('../pages/dashboards/AdminDashboard'));
const ReliefManagerDashboard = lazy(() => import('../pages/dashboards/ReliefManagerDashboard'));
const ShelterManagerDashboard = lazy(() => import('../pages/dashboards/ShelterManagerDashboard'));
const DonorDashboard = lazy(() => import('../pages/dashboards/DonorDashboard'));
const VolunteerDashboard = lazy(() => import('../pages/dashboards/VolunteerDashboard'));
const VolunteerAssignmentsPage = lazy(() => import('../pages/modules/VolunteerAssignmentsPage'));
const VolunteerShelterPage = lazy(() => import('../pages/modules/VolunteerShelterPage'));
const FamiliesPage = lazy(() => import('../pages/modules/FamiliesPage'));
const SheltersPage = lazy(() => import('../pages/modules/SheltersPage'));
const AdmissionsPage = lazy(() => import('../pages/modules/AdmissionsPage'));
const InventoryPage = lazy(() => import('../pages/modules/InventoryPage'));
const ReliefRequestsPage = lazy(() => import('../pages/modules/ReliefRequestsPage'));
const DistributionsPage = lazy(() => import('../pages/modules/DistributionsPage'));
const DonationsPage = lazy(() => import('../pages/modules/DonationsPage'));
const AuditLogsPage = lazy(() => import('../pages/modules/AuditLogsPage'));
const RegisterFamilyPage = lazy(() => import('../pages/modules/RegisterFamilyPage'));
const CreateRequestPage = lazy(() => import('../pages/modules/CreateRequestPage'));
const MedicalPage = lazy(() => import('../pages/modules/MedicalPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const UsersPage = lazy(() => import('../pages/UsersPage'));
const VolunteersPage = lazy(() => import('../pages/modules/VolunteersPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const { ADMIN, SHELTER_MANAGER, RELIEF_MANAGER, DONOR } = ROLES;

function AppRoutes() {
  return (
    <Suspense fallback={<BootScreen label="Loading…" />}>
      <Routes>
        {/* Public */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <WelcomePage />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* /dashboard → the signed-in role's workspace */}
        <Route path="/dashboard" element={<HomeRedirect />} />

        {/* Authenticated app shell */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/relief-manager" element={<ReliefManagerRoute><ReliefManagerDashboard /></ReliefManagerRoute>} />
          <Route path="/shelter-manager" element={<ShelterManagerRoute><ShelterManagerDashboard /></ShelterManagerRoute>} />
          <Route path="/shelter-manager/families/register" element={<ShelterManagerRoute><RegisterFamilyPage /></ShelterManagerRoute>} />
          <Route path="/shelter-manager/requests/create" element={<ShelterManagerRoute><CreateRequestPage /></ShelterManagerRoute>} />
          <Route path="/shelter-manager/inventory" element={<ShelterManagerRoute><InventoryPage /></ShelterManagerRoute>} />
          <Route path="/shelter-manager/distributions" element={<ShelterManagerRoute><DistributionsPage /></ShelterManagerRoute>} />
          <Route path="/donor" element={<DonorRoute><DonorDashboard /></DonorRoute>} />
          <Route path="/volunteer" element={<VolunteerRoute><VolunteerDashboard /></VolunteerRoute>} />
          <Route path="/volunteer/assignments" element={<VolunteerRoute><VolunteerAssignmentsPage /></VolunteerRoute>} />
          <Route path="/volunteer/shelter" element={<VolunteerRoute><VolunteerShelterPage /></VolunteerRoute>} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
          <Route path="/volunteers" element={<ProtectedRoute allowedRoles={[ADMIN, RELIEF_MANAGER]}><VolunteersPage /></ProtectedRoute>} />

          <Route path="/families" element={<ManagerRoute><FamiliesPage /></ManagerRoute>} />
          <Route path="/shelters" element={<ManagerRoute><SheltersPage /></ManagerRoute>} />
          <Route path="/admissions" element={<ManagerRoute><AdmissionsPage /></ManagerRoute>} />
          <Route path="/inventory" element={<OperationalRoute><InventoryPage /></OperationalRoute>} />
          <Route path="/requests" element={<ManagerRoute><ReliefRequestsPage /></ManagerRoute>} />
          <Route path="/distributions" element={<ManagerRoute><DistributionsPage /></ManagerRoute>} />
          <Route
            path="/donations"
            element={
              <ProtectedRoute allowedRoles={[ADMIN, SHELTER_MANAGER, RELIEF_MANAGER, DONOR]}>
                <DonationsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/medical" element={<ManagerRoute><MedicalPage /></ManagerRoute>} />
          <Route path="/audit-logs" element={<AdminRoute><AuditLogsPage /></AdminRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
