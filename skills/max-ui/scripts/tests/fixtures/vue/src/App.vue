<script setup>
import { ref } from 'vue';

const open = ref(true);
</script>

<template>
  <main>
    <section v-if="open" class="modal" role="dialog" aria-modal="true">
      <div class="dialog-grid">
        <button class="toolbar-button" @click="open = false">Close</button>
        <p>Dialog content</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
@media (max-width: 640px) {
  .dialog-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .mobile-only {
    display: block;
  }

  .important-mobile {
    padding: 4px !important;
  }

  .shorthand-grid {
    grid-template-columns: 1fr;
  }

  .scoped-only {
    display: block;
  }

  .font-split {
    font-size: 10px;
  }

  .padding-split {
    padding-inline: 8px;
  }

  .grid-split {
    grid-template-columns: 1fr;
  }
}
</style>

<style scoped>

.dialog-grid {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
}

.toolbar-button {
  height: 26px;
  font-size: 10px;
}

.action-table-head {
  font-size: 9px;
}

.important-mobile {
  padding: 20px;
}

.shorthand-grid {
  grid-template: auto / 240px 1fr;
}

.font-split {
  font-weight: 700;
}

.padding-split {
  padding-top: 12px;
}

.grid-split {
  grid-row: 1;
}

@media (max-height: 720px) {
  .mobile-only {
    display: none;
  }
}
</style>

<style>
.scoped-only {
  display: none;
}
</style>
