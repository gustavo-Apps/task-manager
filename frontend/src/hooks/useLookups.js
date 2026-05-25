/**
 * Hook: carrega os lookups (tipos de atividade e status) uma vez
 * e os mantém disponíveis para os formulários.
 */

import { useState, useEffect } from "react";
import api from "../lib/api";

export function useLookups() {
  const [activityTypes, setActivityTypes] = useState([]);
  const [taskStatuses, setTaskStatuses]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/lookups/activity-types"),
      api.get("/lookups/task-statuses"),
    ])
      .then(([typesRes, statusesRes]) => {
        setActivityTypes(typesRes.data.data.activityTypes);
        setTaskStatuses(statusesRes.data.data.taskStatuses);
      })
      .finally(() => setLoading(false));
  }, []);

  return { activityTypes, taskStatuses, loading };
}
