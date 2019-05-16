(function () {
    const $ = window['$']
    const Vue = window['Vue']
    const client = window['client']
    const serverURL = window['serverURL']

    const PAGE_LIMIT_IN_TABLE = 20
    const IMAGE_CATEGORY_NAME = {
        NOTICE: '比赛通知',
        AWARD: '获奖证书',
        LIST: '获奖名单页'
    }
    const REVIEW_STATUS_ENUMS = {
        WAITING: '未审核',
        NOT_PASS: '审核未通过',
        PASSED: '审核通过'
    }
    const REVIEW_STATUS_COLOR = {
        WAITING: '#999999',
        NOT_PASS: '#990000',
        PASSED: '#009900'
    }

    let vm = new Vue({
        el: '#main',
        data: {
            mode: 'list',
            data: [],
            filter: {
                search: null,
                reviewStatus: null
            },
            pagination: {
                pageIndex: 1,
                pageLimit: PAGE_LIMIT_IN_TABLE,
                count: 0,
                maxPageIndex: 1,
                navigator: []
            },
            detailData: {},
            reviewData: {
                index: null,
                id: null,
                reviewStatus: null,
                competitionIndex: null,
                ratingInfoIndex: null,
                competition: {
                    name: null,
                    category: null,
                    organizer: null,
                    holdTime: null
                },
                ratingInfo: {
                    name: null,
                    category: null,
                    level: null
                }
            },
            competitions: [],
            ratingInfo: []
        },
        computed: {
            reviewStatusEnums() {
                return REVIEW_STATUS_ENUMS
            },
            reviewStatusColor() {
                return REVIEW_STATUS_COLOR
            },
            imageCategoryName() {
                return IMAGE_CATEGORY_NAME
            }
        },
        watch: {
            'reviewData.competitionIndex': function (val) {
                let index = val === ' ' ? -1 : parseInt(val.substring(1))
                if(index === -1) {
                    let data: any = {}
                    for(let d of this.data) {
                        if(d.id === this.reviewData.id) {
                            data = d
                            break
                        }
                    }
                    this.reviewData.competition = {
                        name: data.competitionName,
                        category: data.competitionCategory,
                        organizer: data.organizer,
                        holdTime: data.holdTime,
                    }
                }else{
                    this.reviewData.competition = {
                        name: this.competitions[index].name,
                        category: this.competitions[index].category,
                        organizer: this.competitions[index].organizer,
                        holdTime: this.competitions[index].hold_time,
                    }
                    this.reviewData.ratingInfo = {
                        name: this.competitions[index].rating_info,
                        category: this.competitions[index].rating_info_category,
                        level: this.competitions[index].rating_info_level_title,
                    }
                }
            },
            'reviewData.ratingInfoIndex': function (val) {
                if(val != null) {
                    let index = parseInt(val.substring(1))
                    this.reviewData.ratingInfo = {
                        name: this.ratingInfo[index].competition_name,
                        category: this.ratingInfo[index].category,
                        level: this.ratingInfo[index].level_title,
                    }
                }
            }
        },
        methods: {
            //刷新操作
            requestForReviewInfo() {
                client.admin.competitions.list({}, (ok, s, d) => {
                    if(ok) this.competitions = d
                })
                client.admin.ratingInfo.list({}, (ok, s, d) => {
                    if(ok) this.ratingInfo = d
                })
            },
            requestForList() {
                client.admin.records.list({
                    review__status: this.filter.reviewStatus || null,
                    search: this.filter.search || null,
                    limit: this.pagination.pageLimit,
                    offset: (this.pagination.pageIndex - 1) * this.pagination.pageLimit
                }, (ok, s, d) => {
                    if(ok) {
                        let result = []
                        this.pagination.count = d['count']
                        this.generatePaginationNavigator()
                        for(let data of d['results']) result.push(this.formatForModel(data))
                        this.data = result
                    }else{
                        alert(`发生错误：${s}`)
                    }
                })
            },
            formatForModel(data: any): any {
                return {
                    id: data.id,
                    competitionName: data.competition_name,
                    competitionCategory: data.competition_category,
                    organizer: data.organizer,
                    holdTime: data.hold_time || null,
                    worksName: data.works_name,
                    awardLevel: data.award_level,
                    teacher: data.teacher_info ? {cardId: data.teacher_info.card_id, name: data.teacher_info.name} : {cardId: null, name: null},
                    students: ((main, array) => {
                        let res = []
                        if(main) res.push({
                            cardId: main.card_id,
                            name: main.name,
                            grade: main.clazz_grade,
                            number: main.clazz_number,
                            subject: main.subject,
                            college: main.college,
                            main: true
                        })
                        for(let item of array) {
                            res.push({
                                cardId: item.card_id,
                                name: item.name,
                                grade: item.clazz_grade,
                                number: item.clazz_number,
                                subject: item.subject,
                                college: item.college,
                                main: false
                            })
                        }
                        return res
                    })(data.main_student_info, data.students_info),
                    images: ((images) => {
                        let res = []
                        for(let image of images) {
                            res.push({
                                id: image.id,
                                category: image.category,
                                file: `${serverURL}/static/image/${image.file}`
                            })
                        }
                        return res
                    })(data.images),
                    reviewStatus: data.review_status,
                    ratingCategory: data.rating_category,
                    ratingLevelTitle: data.rating_level_title,
                    ratingLevel: data.rating_level,
                    updateTime: data.update_time ? new Date(data.update_time) : null
                }
            },
            selectRecordType(type: string) {
                this.filter.reviewStatus = type
            },
            generatePaginationNavigator() {
                this.pagination.maxPageIndex = Math.ceil(this.pagination.count / this.pagination.pageLimit)
                //处理导航器的页码分布
                if(this.pagination.maxPageIndex > 1 || this.pagination.pageIndex > this.pagination.maxPageIndex) {
                    const MAX_COUNT = 7
                    let first = this.pagination.pageIndex - Math.floor(MAX_COUNT / 2)
                    if(first + MAX_COUNT > this.pagination.maxPageIndex) {
                        first = this.pagination.maxPageIndex - MAX_COUNT + 1
                    }
                    if(first < 1) {
                        first = 1
                    }
                    let last = first + MAX_COUNT > this.pagination.maxPageIndex ? this.pagination.maxPageIndex : first + MAX_COUNT - 1
                    let arr = []
                    for(let i = first; i <= last; ++i) {
                        arr[arr.length] = i
                    }
                    this.pagination.navigator = arr
                }
            },
            pageTo(pageIndex: number | 'first' | 'prev' | 'next' | 'last') {
                let goal
                if(pageIndex === 'first') {
                    goal = 1
                }else if(pageIndex === 'prev') {
                    goal = this.pagination.pageIndex > 1 ? this.pagination.pageIndex - 1 : 1
                }else if(pageIndex === 'next') {
                    goal = this.pagination.pageIndex < this.pagination.maxPageIndex ? this.pagination.pageIndex + 1 :
                        this.pagination.maxPageIndex > 0 ? this.pagination.maxPageIndex : 1
                }else if(pageIndex === 'last') {
                    goal = this.pagination.maxPageIndex > 0 ? this.pagination.maxPageIndex : 1
                }else if(typeof pageIndex === 'string') {
                    goal = parseInt(pageIndex)
                }else if(typeof pageIndex === 'number') {
                    goal = pageIndex
                }else{
                    goal = null
                }
                if(goal != null && goal !== this.pagination.pageIndex) {
                    this.pagination.pageIndex = goal
                    this.requestForList()
                }
            },
            detail(index: number | any) {
                this.$set(this, 'detailData', typeof index === 'number' ? this.data[index] : index)
                this.mode = 'detail'
            },
            backToList() {
                this.mode = 'list'
                this.detailData = {}
            },
            review(index: number | any) {
                let data = typeof index === 'number' ? this.data[index] : index
                let competitionName = data.competitionName
                this.reviewData.id = data.id
                this.reviewData.reviewStatus = data.reviewStatus
                this.reviewData.ratingInfoIndex = null
                this.reviewData.competitionIndex = ' '
                for(let i = 0; i < this.competitions.length; ++i) {
                    let competition = this.competitions[i]
                    if(competition.name === competitionName) {
                        this.reviewData.competitionIndex = `_${i}`
                        break
                    }
                }

                $('#review-modal #competition-picker').dropdown('set selected', this.reviewData.competitionIndex)
                $('#review-modal #rating-info-picker').dropdown('clear')
                $('#review-modal').modal('show')
            },
            submitReview() {
                if(this.reviewData.reviewStatus === "PASSED" || this.reviewData.reviewStatus === "NOT_PASS") {
                    let data
                    if(this.reviewData.reviewStatus === "NOT_PASS") {
                        data = {review_status: 'NOT_PASS', competition: null}
                    }else if(this.reviewData.competitionIndex === ' ') {
                        if(this.reviewData.ratingInfoIndex == null) {
                            alert('直接新建竞赛记录时，需要指定评级信息。')
                            return
                        }
                        data = {review_status: 'PASSED', competition: null, rating_info: this.reviewData.ratingInfo.name}
                    }else{
                        data = {review_status: 'PASSED', competition: this.reviewData.competition.name}
                    }
                    client.admin.records.update(this.reviewData.id, data, (ok, s, d) => {
                        if(ok) {
                            $('#review-modal').modal('hide')
                            if(this.mode === 'detail') {
                                this.detail(this.formatForModel(d))
                            }
                            this.requestForList()
                        }else{
                            alert(`发生错误： ${s}`)
                        }
                    })
                }else{
                    alert('请首先给出确定的审核结果。')
                }
            },
            download() {
                client.admin.records.download.download({
                    review__status: this.filter.reviewStatus || null,
                    search: this.filter.search || null,
                    limit: this.pagination.pageLimit,
                    offset: (this.pagination.pageIndex - 1) * this.pagination.pageLimit
                }, (ok, s, d) => {
                    const blob = new Blob([d], {type: 'application/zip'})
                    let url = URL.createObjectURL(blob)
                    window.location.href = url
                    // const fileName = '打包.zip'
                    // const link = document.createElement('a')
                    // link.download = fileName
                    // link.style.display = 'none'
                    // link.href = URL.createObjectURL(blob)
                    // document.body.appendChild(link)
                    // link.click()
                    // URL.revokeObjectURL(link.href)
                    // document.body.removeChild(link)
                })
            },

            fmtStdDate(date: Date): string {
                if(!date) return ''
                function fmt(n: number) {
                    return n >= 10 ? n : `0${n}`
                }
                return `${date.getFullYear()}-${fmt(date.getMonth() + 1)}-${fmt(date.getDate())} ${fmt(date.getHours())}:${fmt(date.getMinutes())}`
            },
            fmtStudents(students: any[]): string {
                let result = '', first = true
                for(let student of students) {
                    if(first) {first = false} else {result += ', '}
                    result += student.name
                }
                return result
            },
            fmtTeacherInfo(teacher: any): string {
                if(teacher != null) {
                    return `${teacher.name} [${teacher.cardId}]`
                }
                return null
            },
            fmtStudentInfo(student: any): string {
                if(student != null) {
                    return `${student.college} ${student.subject} ${student.grade}级${student.number}班 ${student.name} [${student.cardId}]`
                        + (student.main ? ' (第一负责人)' : '')
                }
                return null
            }
        },
        created() {
            this.requestForReviewInfo()
            this.requestForList()
        }
    })
    $('#main .dropdown.dropdown-menu').dropdown({action: 'hide'})
    $(`#main .ui.dropdown.dropdown-select`).dropdown({fullTextSearch: true})
    $('.modal').modal({
        centered: false,
        duration: 200
    })
    window['vms']['main'] = vm
})()