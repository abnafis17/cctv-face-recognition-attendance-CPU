"use client";

import EnrollmentControls from "@/features/control/EnrollmentControls";
import { fetchJSON } from "@/lib/api";
import { Camera } from "@/types";
import React, { useEffect, useState } from "react";

const page = () => {
  const [cams, setCams] = useState<Camera[]>([]);
  const [err, setErr] = useState("");

  // Add camera form
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const aiBase = process.env.NEXT_PUBLIC_AI_URL || "http://127.0.0.1:8000";

  async function load() {
    try {
      setErr("");
      const list = await fetchJSON<Camera[]>("/api/cameras");
      setCams(list);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load cameras");
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <div>
      <EnrollmentControls cameras={cams} />
    </div>
  );
};

export default page;
