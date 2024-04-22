<template>
    <div>
        <div class="group_main">
            <el-form :inline="true">
                <el-form-item>
                    <el-button type="danger" :disabled="checkIdArry.length==0" @click="delFileBtn(0,1)">批量删除</el-button>
                    <el-button type="primary" @click="createDatabtn(0,1)">WS数据入库</el-button>
                    <el-input class="cus_input_18" style="margin: 0 10px;" v-model="dataParams.task_name" clearable placeholder="输入文件名称"/>
                    <el-button type="primary" icon="Search" @click="getDatalist(1)">查询</el-button>
                </el-form-item>
            </el-form>
            <div class="tab_check_warp">
                <i slot="reference" class="el-icon-info"></i>
                <div>已选 {{ checkIdArry.length }} 项</div>
            </div>
            <div>
                <el-table :data="dataList" ref="dataTable" border height="640" v-loading="loading" element-loading-background="rgba(122, 122, 122, .1)" @selection-change="handleSelectionChange" @row-click="rowSelectChange">
                    <el-table-column type="selection" width="55" />
                    <el-table-column prop="name" label="数据名称" minWidth="140" />
                    <el-table-column prop="invalidNum" label="无效数据" minWidth="100" />
                    <el-table-column prop="upNum" label="上传数据" minWidth="100" />
                    <el-table-column prop="sourceRepeatNum" label="源重复数据" minWidth="100" />
                    <el-table-column prop="repeatNum" label="账号内重复" minWidth="100" />
                    <el-table-column prop="intoNum" label="入库数量" minWidth="100" />
                    <el-table-column prop="residueNum" label="剩余数量" minWidth="100" />
                    <el-table-column prop="upStatus" label="任务状态" minWidth="100">
                        <template  #default="scope">
                            <el-tag :type="scope.row.up_status==1?'warning':'success'"> {{ taskOption[scope.row.upStatus] }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="创建时间" width="160" >
                        <template #default="scope">{{ formatDate(scope.row.CreatedAt) }}</template>
                    </el-table-column>
                    <el-table-column label="操作" width="260">
                        <template #default="scope">
                            <el-popover placement="left" :width="200" trigger="click">
                                <span>剩余数据明细</span>
                                <div style="display: flex;justify-content: flex-end;">
                                    合计 0 条
                                </div>
                                <div>
                                    <template v-if="residueList.length>0">
                                        <div class="residue_less" ref="lazyEle" @scroll="lazyScroll">
                                            <el-button v-if="moreLoading" class="loading_icon" :loading="true"></el-button>
                                            <template v-else>
                                                <div v-for="(item,idx) in residueList" :key="idx">{{ item }}</div>
                                                <div class="no_more" v-if="isMore">没有更多了</div>
                                            </template>
                                        </div>
                                    </template>
                                    <p v-else>暂无数据...</p>
                                </div>
                                <template #reference>
                                    <el-button :disabled="checkIdArry.length>0" type="warning" @click.stop="showLeaveNum(scope.row)">剩余数量</el-button>
                                </template>
                            </el-popover>
                            <el-button :disabled="checkIdArry.length > 0" type="primary" @click.stop="createDatabtn(scope.row,2)">补充</el-button>
                            <el-button :disabled="checkIdArry.length > 0" type="danger" style="margin-left:10px;" @click.stop="delFileBtn(scope.row, 2)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
                <div class="layui_page">
                    <el-pagination background @size-change="setPageSize" @current-change="switchPage"
                        :page-sizes="pageOption" :current-page.sync="dataParams.page" :page-size="dataParams.limit"
                        layout="total, sizes, prev, pager, next, jumper" :total="dataParams.total">
                    </el-pagination>
                </div>
            </div>
        </div>
        <el-dialog v-model="dialogVisible" title="上传数据" width="400" :close-on-click-modal="false">
            <div>
                <el-form ref="dataRef" :model="dataForm" :rules="dataRules" label-width="auto">
                    <el-form-item label="文件名称" prop="name">
                        <el-input :disabled="dataForm.ptype==2" v-model="dataForm.name" clearable />
                    </el-form-item>
                    <el-form-item label-width="0" v-if="dialogVisible">
                        <el-upload ref="uploadRef" :limit="1" :auto-upload="false" :on-change="handleChangeFile" accept=".txt" style="width: 100%;">
                            <template #trigger>
                                <el-button plain>选择文件</el-button>
                            </template>
                        </el-upload>
                    </el-form-item>
                    <el-form-item>
                        <div class="el-r-but">
                            <el-button @click="dialogVisible = false">取消</el-button>
                            <el-button type="primary" :disabled="!dataForm.file_url":loading="isLoading" @click="submitForm(dataRef)">确定</el-button>
                        </div>
                    </el-form-item>
                </el-form>
            </div>
        </el-dialog>
        <el-dialog v-model="delParams.delVisible" title="提示" top="40vh" width="420" :close-on-click-modal="false">
            <div style="display:flex;align-items: center;"> 
                <el-icon size="21" color="#e6a23c"><WarningFilled /></el-icon>
                <span style="display:flex;margin-left: 5px;">确认要删除吗？</span>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="delParams.delVisible = false">取消</el-button>
                    <el-button type="primary" :loading="delParams.delLoading" @click="handleDelBtn">确定</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script lang='ts' setup name='data_list'>
    import { reactive, ref, nextTick } from 'vue'
    import { successTips} from '@/core/global'
    import { formatDate } from '@/utils/format'
    import { FormInstance, FormRules} from 'element-plus'
    import { getDataList,createDataPack,upload,deleteDataPack,deleteDataPackByIds } from '@/api/data_list'
    interface dataStruct {
        ID:number,
        name: string
        file_url: string
        ptype:number
    }
    let dataList = ref([])
    let timer = ref(null)
    let lazyEle = ref(null)
    let dataTable = ref()
    let uploadRef = ref("")
    let isMore = ref(false)
    let loading = ref(false)
    let isLoading = ref(false)
    let moreLoading = ref(false)
    let dialogVisible = ref(false)
    const residueList = ref([
        "18295786951",
        "18295786951",
        "18295786951",
        "18295786951",
        "18295786951",
        "18295786951",
        "18295786951",
        "18295786951",
        "18295786951",
        "18295786951",
        "18295786951",
    ])
    const checkIdArry = ref([])
    const dataRef = ref<FormInstance>()
    const taskOption = ref(["","上传中...","已完成"])
    const pageOption = ref([10, 20, 50, 100, 200, 500, 1000])
    const delParams = reactive({
        del_id:"",
        delVisible:false,
        delLoading:false,
        dialogType:null
    })
    const remaParams = reactive({
        page:1,
        limit:10,
        total:0,
    })
    const dataParams = reactive({
        page:1,
        limit:10,
        total:0,
        task_name:""
    })
    const dataForm = reactive<dataStruct>({
        ID:null,
        name:"",
        file_url:"",
        ptype:null
    })
    const dataRules = reactive<FormRules<dataStruct>>({
        name: [
            { required: true, message: '请输入文件名称', trigger: 'blur' }
        ]
    })
    const handleSelectionChange = (row:any) => {
        checkIdArry.value = row.map(item => item.ID);
    }
    const rowSelectChange = (row:any) => {
        let refsElTable = dataTable.value;
        let findRow = checkIdArry.value.find(item => item == row.ID);
        if (findRow) {
            refsElTable.toggleRowSelection(row, false);
            return;
        }
        refsElTable.toggleRowSelection(row,true);
    }
    const getDatalist = async (num?:number) => {
        dataParams.page=num?num:dataParams.page;
        loading.value=true;
        const res = await getDataList({page:dataParams.page,pageSize:dataParams.limit,name:dataParams.task_name})
        loading.value=false;
        const {data:{list,total}} = res
        dataList.value = list||[];
        dataParams.total = total;
    }
    getDatalist();
    const showLeaveNum = (row:any)=>{
        lazyScroll();
    }
    const lazyScroll = ()=>{
        isMore.value = false;
        const container = lazyEle.value
        if (container.scrollTop + container.clientHeight >= container.scrollHeight && residueList.value.length<60) {
            clearTimeout(timer.value);
            // moreLoading.value=true;
            timer.value = setTimeout(() => {
                console.log("8888");
                for (let k = 0; k < 10; k++) {
                    let item = `18295786952${k}`
                    residueList.value.push(item)
                }
                moreLoading.value=false;
                // remaParams.page +=1;
                // getresiduenum({id:this.model2.id,page:this.model2.page,limit:this.model2.limit}).then(res=>{
                //     moreLoading.value=false;
                //     if (res.code !=0)return;
                //     residueList.value = this.residueList.concat(res.data.list)
                // })
            }, 500);
        }else{
            timer.value = setTimeout(() => {
                isMore.value = true;
            }, 500);
        }

        // let scrollEle = lazyEle;
        // let scrollbtn = scrollEle.scrollHeight - scrollEle.scrollTop-scrollEle.clientHeight;
        // clearTimeout(this.timer);
        // if (scrollbtn < 20 && this.residueList.length < this.model2.total) {
        //     this.timer = setTimeout(() => {
        //         this.isMore = false;
        //         this.model2.page +=1;
        //         getresiduenum({id:this.model2.id,page:this.model2.page,limit:this.model2.limit}).then(res=>{
        //             this.moreLoading=false;
        //             if (res.code !=0)return;
        //             this.residueList = this.residueList.concat(res.data.list)
        //         })
        //     }, 500);
        // }else{
        //     this.timer = setTimeout(() => {
        //         this.isMore = true;
        //     }, 500);
        // }
    }
    const setPageSize = (size:number) => {
        dataParams.limit = size;
        getDatalist(1);
    }
    const switchPage = (page:number) => {
        dataParams.page = page;
        getDatalist();
    }
    const delFileBtn = (row?:any,type?:number) => {
        delParams.dialogType = type;
        delParams.del_id = row.ID;
        delParams.delVisible = true;
    }
    const handleDelBtn = async() => {
        let params = {IDs:[]}
        delParams.dialogType==1?params.IDs=checkIdArry.value:params.IDs=[delParams.del_id];
        delParams.delVisible = true;
        const res:any = await deleteDataPackByIds(params);
        delParams.delVisible = false;
        if (res.code != 0) return;
        delParams.delVisible = false;
        getDatalist(1)
        successTips();
    }
    const handleChangeFile = async (file:any) => {
        if (!file) return;
        let formData = new FormData();
        formData.append('file', file.raw);
        const res:any = await upload(formData);
        if (res.code != 0) return;
        dataForm.file_url = res.data.file.url;
    };
    const createDatabtn = async (row:any,type:number) => {
        dataForm.ptype=type;
        dataForm.name=row?.name||"";
        dataForm.ID=row?.ID||null;
        dialogVisible.value = true;
        await nextTick();
        if (type == 1) {
            dataRef.value?.resetFields()
            dataForm.file_url="";
        }
    }
    const submitForm = async (formEl: FormInstance | undefined) => {
        if (!formEl) return;
        await formEl.validate(async(valid, fields) => {
            if (valid) {
                isLoading.value=true;
                dataForm.ptype==1? delete dataForm.ID:"";
                const res:any = await createDataPack(dataForm);
                isLoading.value=false;
                if ((res.code ) !=0) return;
                getDatalist(1)
                successTips();
                dialogVisible.value = false;
            } else {
            console.log('error submit!', fields)
            }
        })
    }

</script>

<style lang='scss' scoped>
    .tab_check_warp{
        margin-bottom: 10px;
    }
    .change_file_name{
        width:100%;
        display:flex;
        margin-top: 5px;
        padding: 5px 5px;
        line-height: 1;
        cursor: pointer;
        border-radius: 4px;
        align-items:center;
        box-sizing: border-box;
        justify-content:space-between;
        .l_name{
            display: flex;
            color: #606266;
            align-items:center;
            span{
                font-size: 14px;
            }
        }
        .close_icon{
            opacity: 0;
            margin-right: 3px;
        }
    }
    .change_file_name:hover{
        background-color: #f5f7fa;
        .close_icon{
            opacity: 1;
        }
    }
    .residue_less{
        width: 100%;
        max-height: 100px;
        overflow: hidden;
        overflow-y: auto;
        .no_more{
            font-size: 12px;
            margin-top: 5px;
        }
    }
    .loading_icon{
        margin-top: 10px;
    }

</style>
