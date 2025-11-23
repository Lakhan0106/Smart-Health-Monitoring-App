import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/useAuthStore';
import PatientMetricsView from '../components/PatientMetricsView';
import CaretakerMetricsView from '../components/CaretakerMetricsView';

export default function HealthMetrics() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Dashboard</span>
        </Link>

        {user?.role === 'Patient' ? <PatientMetricsView /> : <CaretakerMetricsView />}
      </div>
    </div>
  );
}
