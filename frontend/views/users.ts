(function () {
    const $ = window['$']
    const Vue = window['Vue']
    const client = window['client']
    const prefix = window['prefix'] || ''
    const setTitle = window['setTitle']
    const serverURL = window['serverURL']
    const Excel = window['Excel']

    const USER_TYPE_ENUMS = {
        ADMIN: '管理员',
        TEACHER: '教师',
        STUDENT: '学生'
    }

    let vm = new Vue({
        el: '#main',
        data: {
            data: [],
            filter: {
                search: null,
                userType: null
            },
            editor: {
                username: '',
                userType: '',
                name: '',
                password: '',
                check: ''
            },
            creator: {
                username: '',
                userType: 'ADMIN',
                password: '',
                check: '',
                name: ''
            }
        },
        computed: {
            userTypeEnums() {
                return USER_TYPE_ENUMS
            }
        },
        methods: {
            //刷新操作
            requestForList() {
                client.admin.users.list({
                    user_type: this.filter.userType || null,
                    search: this.filter.search || null
                }, (ok, s, d) => {
                    if(ok) {
                        let result = []
                        for(let data of d) result.push(this.formatForModel(data))
                        this.data = result
                    }else{
                        alert(`发生错误：${s}`)
                    }
                })
            },
            formatForModel(data: any): any {
                return {
                    userType: data.username.split(':')[0],
                    username: data.username.split(':')[1],
                    name: data.name,
                    last_login: data.last_login ? new Date(data.last_login) : null,
                    date_joined: data.date_joined ? new Date(data.date_joined) : null
                }
            },
            selectUserType(type: string) {
                this.filter.userType = type
            },
            create() {
                this.creator.username = ''
                this.creator.password = ''
                this.creator.check = ''
                this.creator.name = ''
                $('#create-modal').modal('show')
            },
            edit(index: number) {
                let item = this.data[index]
                this.editor = {
                    username: item.username,
                    userType: item.userType,
                    name: item.name,
                    password: '',
                    check: ''
                }
                $('#edit-modal').modal('show')
            },
            backToList() {
                this.requestForList()
            },
            submitEdit() {
                let name = undefined, password = undefined
                if(this.editor.name && this.editor.name.length > 0) {
                    name = this.editor.name
                }else{
                    alert('姓名不能为空。')
                }
                if(this.editor.password) {
                    if(!this.editor.check) alert('请再次确认密码。')
                    else if(this.editor.check !== this.editor.password) alert('两次输入的密码不一致。')
                    else password = this.editor.password
                }
                let result = {name, password}
                client.admin.users.update(`${this.editor.userType}:${this.editor.username}`, result, (ok, s, d) => {
                    if(ok) {
                        $('#edit-modal').modal('hide')
                        this.requestForList()
                    }else{
                        alert(`发生错误： ${s}`)
                    }
                })
            },
            submitCreate() {
                if(!this.creator.username) alert('请输入正确的用户名。')
                else if(this.creator.password && this.creator.password !== this.creator.check) alert('两次输入的密码不一致。')
                else {
                    client.admin.users.create({
                        username: this.creator.username,
                        user_type: this.creator.userType,
                        password: this.creator.password || null,
                        name: this.creator.name || null
                    }, (ok, s, d) => {
                        if(ok) {
                            $('#create-modal').modal('hide')
                            this.requestForList()
                        }else{
                            alert(`发生错误： ${s}`)
                        }
                    })
                }
            },
            selectCreatorUserType(type: string) {
                this.creator.userType = type
            },
            fmtStdDate(date: Date): string {
                if(!date) return ''
                function fmt(n: number) {
                    return n >= 10 ? n : `0${n}`
                }
                return `${date.getFullYear()}-${fmt(date.getMonth() + 1)}-${fmt(date.getDate())} ${fmt(date.getHours())}:${fmt(date.getMinutes())}`
            }
        },
        created() {
            this.requestForList()
        }
    })
    $('#main .dropdown.dropdown-menu').dropdown({action: 'hide'})
    $('.modal').modal({
        centered: false,
        duration: 200
    })
    window['vms']['main'] = vm
})()