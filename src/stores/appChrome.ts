import { defineStore } from 'pinia'

export const useAppChromeStore = defineStore('appChrome', {
  state: () => ({
    hasAvailableUpdate: false,
  }),
  actions: {
    setHasAvailableUpdate(value: boolean) {
      this.hasAvailableUpdate = value
    },
  },
})
