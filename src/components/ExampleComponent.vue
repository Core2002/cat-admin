<template>
  <q-card flat bordered>
    <q-card-section>
      <q-item-label class="text-h6">{{ title }}</q-item-label>
    </q-card-section>

    <q-list separator>
      <q-item v-for="todo in todos" :key="todo.id" clickable @click="increment">
        <q-item-section>
          <q-item-label>{{ todo.id }} - {{ todo.content }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <q-card-section>
      <q-item-label>Count: {{ todoCount }} / {{ meta.totalCount }}</q-item-label>
      <q-item-label>Active: {{ active ? 'yes' : 'no' }}</q-item-label>
      <q-item-label>Clicks on todos: {{ clickCount }}</q-item-label>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Todo, Meta } from './models';

interface Props {
  title: string;
  todos?: Todo[];
  meta: Meta;
  active: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  todos: () => [],
});

const clickCount = ref(0);
function increment() {
  clickCount.value += 1;
  return clickCount.value;
}

const todoCount = computed(() => props.todos.length);
</script>
