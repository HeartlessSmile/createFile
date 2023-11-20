<template>
  <PageSearchTable
    ref="PageSearchTable"
    :columnsTable="columnsTable"
    :searchList="searchList"
    :formValidate.sync="formValidate"
  >
    <div class="button-con" slot="tool">
      <a class="btn btn-outline-info" @click="openConfirmModal">删除</a>
    </div>
    <!-- 删除 -->
    <confirm-delete :deleteData="deleteData" ref="confirmDelModal">
      <div>请确认是否删除？</div>
    </confirm-delete>
  </PageSearchTable>
</template>
<script>
import confirmDelete from '@/components/common-component/modal/confirm-delete'
import PageSearchTable from '@/components/common-component/PageSearchTable/index'
import { getApiAsync, dataTransferText } from '@/misc/baseDict'

export default {
  name: '##fileName##',
  components: {
    PageSearchTable,
    confirmDelete
  },
  data () {
    return {
      compare_status: [],
      columnsTable: [
        {
          type: 'selection',
          width: '60',
          fixed: 'left',
          align: 'center'
        },
        {
          title: '税号',
          key: 'orgTaxNum',
          width: 200
        },
        {
          title: '比对状态',
          key: 'status',
          width: 150,
          render: (h, params) => {
            var data = dataTransferText(this.compare_status_arr, params.row.status, 'compare_status')
            return h('span', data)
          }
        }
      ],
      formValidate: {
        orgCode: '',
        status: '',
        peroidStr: ''
      },
      searchList: [
        {
          type: 'input',
          label: '机构编码',
          key: 'orgCode',
          label_hh: false,
          placeholder: '请输入机构编码',
          clearable: true
        },
        {
          type: 'select',
          label: '比对状态',
          key: 'status',
          label_hh: false,
          placeholder: '请选择',
          clearable: true,
          filterable: true,
          option: () => {
            return this.compare_status_arr
          }
        },
        {
          type: 'date',
          dateType: 'month',
          label: '所属期',
          key: 'peroidStr',
          label_hh: false,
          placeholder: '请输入机构名称/税号',
          clearable: true
        }
      ],
      condition: [
        { f: 'orgCode', op: 'like', t: 's' },
        { f: 'status', op: 'eq', t: 's' },
        { f: 'peroidStr', op: 'like', t: 's' }
      ]
    }
  },
  methods: {
    init () {
      const params = {
        module: '##apiFileName##',
        api: 'list',
        condition: this.condition,
        params: {}
      }
      this.$refs.PageSearchTable.params = params
      this.$refs.PageSearchTable.dataTableShow()
    },
    openConfirmModal () {
      let selectdata = this.$refs.PageSearchTable.getSelectData()
      if (selectdata.length == 0) {
        this.$Message.warning('请选择一条数据')
        return false
      }
      this.$refs.confirmDelModal.deleteconfirm = true
    },
    deleteData () {
      let ids = this.$refs.PageSearchTable.getSelectData()
        .map((el) => el.id)
        .toString()
      this.$api.ledgerApi
        .small_micro_tax_free_subject({ ids })
        .then((res) => {
          const { result, infos } = res.data
          this.visible = false
          if (result == 'success') {
            this.$Message.success(infos)
            this.$refs.confirmDelModal.deleteconfirm = false
            this.$refs.PageSearchTable.dataTableShow('pagejump')
          } else {
            this.$Message.error(infos)
          }
        })
        .catch((err) => {
          console.log(err)
        })
    },
    handleSuccess () {
      this.$refs.PageSearchTable.dataTableShow('pagejump')
    },
    getDict () {
      let params = ['compare_status']
      getApiAsync(params.toString()).then((res) => {
        this.compare_status_arr = res[params[0]]
      })
    }
  },
  mounted () {
    this.init()
    this.getDict()
  }
}
</script>
<style lang="scss" scoped></style>
