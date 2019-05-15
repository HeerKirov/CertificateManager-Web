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
            editor: {
                name: '',
                category: '',
                organizer: '',
                hold_time: '',
                rating_info: '',
                rating_info_level: ''
            },
            ui: {
                mode: 'list',
                editName: null,
                ratingInfo: []
            }
        },
        methods: {
            //刷新操作
            requestForRatingInfo() {
                client.admin.ratingInfo.list({}, (ok, s, d) => {
                    if(ok) {
                        this.ui.ratingInfo = d
                    }
                })
            },
            requestForList() {
                client.admin.competitions.list({
                    search: this.filter.search || null
                }, (ok, s, d) => {
                    if(ok) {
                        this.data = d
                    }else{
                        alert(`发生错误：${s}`)
                    }
                })
            },
            create() {
                this.ui.mode = 'create'
                this.editor = {
                    name: '',
                    category: '',
                    organizer: '',
                    hold_time: '',
                    rating_info: '',
                    rating_info_level: ''
                }
            },
            edit(index: number) {
                let item = this.data[index]
                this.ui.editName = item['name']
                this.ui.mode = 'edit'
                this.editor = {
                    name: item['name'],
                    category: item['category'],
                    organizer: item['organizer'],
                    hold_time: item['hold_time'],
                    rating_info: item['rating_info'] || '',
                    rating_info_level: item['rating_info_level_title'] || ''
                }
            },
            backToList() {
                this.ui.mode = 'list'
                this.requestForList()
            },
            selectRatingInfo(info) {
                this.editor.rating_info = info.competition_name
                this.editor.rating_info_level = info.level_title
            },
            submit() {
                if(this.ui.mode === 'create') {
                    client.admin.competitions.create({
                        name: this.editor.name,
                        category: this.editor.category,
                        hold_time: this.editor.hold_time,
                        organizer: this.editor.organizer,
                        rating_info: this.editor.rating_info
                    }, (ok, s, d) => {
                        if(ok) {
                            this.backToList()
                        }else{
                            alert(`发生错误： ${s}`)
                        }
                    })
                }else{
                    client.admin.competitions.update(this.ui.editName, {
                        name: this.editor.name,
                        category: this.editor.category,
                        hold_time: this.editor.hold_time,
                        organizer: this.editor.organizer,
                        rating_info: this.editor.rating_info
                    }, (ok, s, d) => {
                        if(ok) {
                            this.backToList()
                        }else{
                            alert(`发生错误： ${s}`)
                        }
                    })
                }
            }
        },
        created() {
            this.requestForRatingInfo()
            this.requestForList()
        }
    })
    $('#main .dropdown.dropdown-menu').dropdown({action: 'hide'})
    window['vms']['main'] = vm
})()