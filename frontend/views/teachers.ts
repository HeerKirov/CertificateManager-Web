(function () {
    const $ = window['$']
    const Vue = window['Vue']
    const client = window['client']
    const prefix = window['prefix'] || ''
    const setTitle = window['setTitle']
    const serverURL = window['serverURL']
    const Excel = window['Excel']

    let vm = new Vue({
        el: '#main',
        data: {
            data: [],
            filter: {
                search: null
            },
            ui: {
            }
        },
        methods: {
            //上传操作
            openFileUpload() {
                $('#main #file-upload').click()
            },
            fileUpload() {
                Excel.uploadXlsx('#main #file-upload', (xlsx) => {
                    let json = Excel.translateXlsxToJson(xlsx, {
                        工号: 'card_id',
                        姓名: 'name'
                    })
                    if(json) {
                        client.admin.teacherBatch.post(json, (ok, s, d) => {
                            if(ok) {
                                alert('上传成功。')
                                this.requestForList()
                            }else{
                                alert(`发生错误： ${s}`)
                            }
                        })
                    }
                })
            },
            //刷新操作
            requestForList() {
                client.admin.teachers.list({
                    search: this.filter.search || null
                }, (ok, s, d) => {
                    if(ok) {
                        this.data = d
                    }else{
                        alert(`发生错误：${s}`)
                    }
                })
            }
        },
        created() {

        }
    })
    window['vms']['main'] = vm
})()