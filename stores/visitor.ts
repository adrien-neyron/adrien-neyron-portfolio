import { defineStore } from "pinia";

export const useVisitorStore = defineStore("visitor", () => {
  const count = ref<number | null>(null);

  async function fetchCount() {
    const data = await $fetch<{ count: number }>("/api/visitors");
    count.value = data.count;
  }

  async function trackVisit(payload?: {
    intent?: string;
    domain?: string;
    email?: string;
  }) {
    const KEY = "portfolio_visitor_counted";
    if (typeof localStorage === "undefined") return;
    if (localStorage.getItem(KEY)) return;

    localStorage.setItem(KEY, "true");
    const result = await $fetch<{ count: number }>("/api/visitors", {
      method: "POST",
      body: payload ?? {},
    });
    count.value = result.count;
  }

  return { count, fetchCount, trackVisit };
});
