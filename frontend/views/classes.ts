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
                college: null,
                subject: null,
                grade: null
            },
            ui: {
                filterSwitch: false,
                collegeSet: {},
                colleges: [],
                subjects: []
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
                        学院: 'college',
                        年级: 'grade',
                        专业: 'subject',
                        班级: 'number'
                    })
                    if(json) {
                        client.admin.classBatch.post(json, (ok, s, d) => {
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
                client.admin.classes.list({
                    subject__college__name: this.filter.college || null,
                    subject__name: this.filter.subject || null,
                    grade: this.filter.grade || null
                }, (ok, s, d) => {
                    if(ok) {
                        this.data = d
                        this.generateFilter()
                    }else{
                        alert(`发生错误：${s}`)
                    }
                })
            },
            //过滤器相关
            selectCollege(college: string) {
                if(this.filter.college !== college) {
                    this.filter.college = college
                    if(this.filter.college in this.ui.collegeSet) {
                        this.ui.subjects = this.ui.collegeSet[this.filter.college]
                    }else{
                        this.ui.subjects = []
                    }
                    this.selectSubject(null)
                }
            },
            selectSubject(subject: string) {
                this.filter.subject = subject
            },
            generateFilter() {
                client.admin.subjects.list({}, (ok, s, data) => {
                    if(ok) {
                        let result = {}
                        for(let d of data) {
                            let college = d.college, subject = d.name
                            let list
                            if(college in result) {
                                list = result[college]
                            }else{
                                result[college] = list = []
                            }
                            let exist = false
                            for(let item of list) {
                                if(item === subject) {
                                    exist = true
                                    break
                                }
                            }
                            if(!exist) list[list.length] = subject
                        }
                        let colleges = []
                        for(let college in result) {
                            colleges[colleges.length] = college
                        }
                        this.ui.colleges = colleges
                        this.ui.collegeSet = result
                    }
                })

            }
        },
        created() {
            this.generateFilter()
        }
    })
    $('#main .dropdown.dropdown-menu').dropdown({action: 'hide'})
    window['vms']['main'] = vm
})()