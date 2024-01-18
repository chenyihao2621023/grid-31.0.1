<template>
  <div style="height: 1000px;">
    <div class="container" style="height: 1000px;">
      <div>
        <button v-on:click="onBtExport()" style="margin-bottom: 5px; font-weight: bold;">Export to Excel</button>
      </div>
      <div class="grid-wrapper" style="height: 1000px;">
        <ag-grid-vue

            style="width: 100%; height: 100%;"
            :class="themeClass"
            :columnDefs="columnDefs"
            @grid-ready="onGridReady"
            :defaultColDef="defaultColDef"
            :rowData="rowData"></ag-grid-vue>
      </div>
    </div>
  </div>
  
</template>

<script>
import '@/components/zing-grid/zing-grid-enterprise/main.js'
import "@/components/zing-grid/zing-grid-community/styles/zing-grid.css";
import "@/components/zing-grid/zing-grid-community/styles/zing-theme-quartz.css";
// import "@/components/zing-grid/ag-grid-enterprise.esm.js";
import { ZingGridVue } from "@/components/zing-grid/zing-grid-vue/main.js";
window.arrayComparator = function arrayComparator(a, b) {
  if (a == null) {
    return b == null ? 0 : -1;
  } else if (b == null) {
    return 1;
  }
  for (let i = 0; i < a.length; i++) {
    if (i >= b.length) {
      return 1;
    }
    const comparisonValue = reverseOrderComparator(a[i], b[i]);
    if (comparisonValue !== 0) {
      return comparisonValue;
    }
  }
  return 0;
};

window.reverseOrderComparator = function reverseOrderComparator(a, b) {
  return a < b ? 1 : a > b ? -1 : 0;
};

window.processData = function processData(data) {
  const flattenedData = [];
  const flattenRowRecursive = (row, parentPath) => {
    const dateParts = row.startDate.split('/');
    const startDate = new Date(
        parseInt(dateParts[2]),
        dateParts[1] - 1,
        dateParts[0]
    );
    const dataPath = [...parentPath, row.employeeName];
    flattenedData.push({ ...row, dataPath, startDate });
    if (row.underlings) {
      row.underlings.forEach((underling) =>
          flattenRowRecursive(underling, dataPath)
      );
    }
  };
  data.forEach((row) => flattenRowRecursive(row, []));
  return flattenedData;
};
export default {
  name: "App",

  components: {
    ZingGridVue,
  },
  data: function () {
    return {
      columnDefs: [
        { field: 'athlete', minWidth: 200 },
        {
          headerName: 'Group B',
          children: [
            { field: 'sport', minWidth: 150 },
            { field: 'gold' },
            { field: 'silver' },
            { field: 'bronze' },
            { field: 'total' },
          ],
        },
      ],
      gridApi: null,
      themeClass:
          "ag-theme-quartz",
      defaultColDef: {
        filter: true,
        minWidth: 100,
        flex: 1,
      },
      rowData: null,
    };
  },
  created() {},
  methods: {
    onBtExport() {
      this.gridApi.exportDataAsExcel();
    },
    onGridReady(params) {
      this.gridApi = params.api;

      const updateData = (data) => {
        this.rowData = data;
      };

      fetch('https://www.ag-grid.com/example-assets/small-olympic-winners.json')
          .then((resp) => resp.json())
          .then((data) => updateData(data));
    },
  },
};
</script>