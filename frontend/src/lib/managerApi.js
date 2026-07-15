/**
 * Manager API — cliente para os endpoints /manager
 */

import api from "./api";

export async function fetchDashboard() {
  const res = await api.get("/manager/dashboard");
  return res.data.data;
}

export async function fetchEmployees() {
  const res = await api.get("/manager/employees");
  return res.data.data.employees;
}

export async function fetchEmployee(id) {
  const res = await api.get(`/manager/employees/${id}`);
  return res.data.data;
}

export async function fetchActivities(filters = {}) {
  const res = await api.get("/manager/activities", { params: filters });
  return res.data.data.activities;
}

export async function fetchStatistics(filters = {}) {
  const res = await api.get("/manager/statistics", { params: filters });
  return res.data.data;
}

export function getExportMdUrl(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return `/api/manager/export/md${params ? "?" + params : ""}`;
}

export function getExportPdfUrl(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return `/api/manager/export/pdf${params ? "?" + params : ""}`;
}
