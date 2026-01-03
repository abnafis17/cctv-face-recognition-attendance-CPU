"use client";
import { Button } from "@/components/ui/button";
import { logoutApi } from "@/services/auth";

export function LogoutButton() {
  return (
    <Button variant="outline" onClick={() => logoutApi()}>
      Logout
    </Button>
  );
}
