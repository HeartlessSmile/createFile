<template>
  <Modal
    width="400"
    title="重新解析数据"
    v-model="visible"
    :mask-closable="false"
  >
    <div class="col-md-12 pd0 fontsize14">
      <p style="margin-bottom: 16px">重新解析将清空当前所属期的数据重新进数</p>
      <Form
        ref="formValidate"
        :model="formValidate"
        :rules="ruleValidate"
        :label-width="100"
      >
        <FormItem label="起止时间：" prop="declareDate">
          <DatePicker
            type="daterange"
            @on-change="formValidate.declareDate = $event"
            :value="formValidate.declareDate"
            placeholder="请选择"
            style="width: 100%"
          ></DatePicker>
        </FormItem>
      </Form>
    </div>
    <div slot="footer">
      <slot name="footeBtn">
        <Button type="default" @click="visible = false">取消</Button>
        <Button type="primary" @click="sure">确定</Button>
      </slot>
    </div>
  </Modal>
</template>
<script>
export default {
  name: 'AddModal',
  components: {},
  data () {
    return {
      visible: false,
      formValidate: {
        declareDate: null
      },
      ruleValidate: {
        declareDate: [
          {
            required: true,
            message: '起止时间不能为空',
            trigger: 'change',
            type: 'array'
          }
        ]
      }
    }
  },
  methods: {
    openModal () {
      this.$refs.formValidate.resetFields()
      this.formValidate.declareDate = []
      this.visible = true
    },
    sure () {
      this.$refs.formValidate.validate((valid) => {
        if (valid) {
          const { declareDate } = this.formValidate
          let [beginDate, endDate] = declareDate
          this.$api.ledgerApi
            .small_micro_tax_free_analysis({ beginDate, endDate })
            .then((res) => {
              const { result, infos, data } = res.data
              this.visible = false
              if (result == 'success') {
                this.$Message.success(infos)
                this.$emit('success')
              } else {
                this.$Message.error(infos)
              }
            })
            .catch((err) => {
              console.log(err)
            })
        }
      })
    }
  }
}
</script>
<style lang="scss" scoped></style>
