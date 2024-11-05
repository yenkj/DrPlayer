<template>
  <div class="header-toolbar">
    <div class="toolbar-left">
      <Button icon="pi pi-arrow-left" class="toolbar-btn" />
      <Button icon="pi pi-arrow-right" class="toolbar-btn" />
      <Button icon="pi pi-refresh" class="toolbar-btn" />
    </div>
    <div class="toolbar-center">
      <input type="text" placeholder="搜索..." class="search-input" />
    </div>
    <div class="toolbar-right">
      <Button icon="pi pi-window-minimize" class="toolbar-btn" />
      <Button icon="pi pi-window-maximize" class="toolbar-btn" />
      <Button icon="pi pi-times" class="toolbar-btn" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'HeaderToolbar',
};
</script>

<style scoped>
.header-toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #34495e;
  color: white;
  padding: 10px 20px;
  z-index: 1000; /* 确保头部在侧边栏上方 */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.header-toolbar .toolbar-left,
.header-toolbar .toolbar-right {
  display: flex;
  gap: 10px;
}

.header-toolbar .toolbar-center {
  flex: 1;
  text-align: center;
}

.toolbar-btn {
  background-color: transparent;
  color: white;
  border: 1px solid #555;
  padding: 5px 10px;
  border-radius: 4px;
}

.toolbar-btn:hover {
  background-color: #3e8e41;
  cursor: pointer;
}

.search-input {
  width: 250px;
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #555;
  background-color: #2c3e50;
  color: white;
}

.search-input::placeholder {
  color: #aaa;
}
</style>
