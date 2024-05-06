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
                <el-table :data="dataList" :summary-method="getSummaries" show-summary ref="dataTable" border :height="tableHeight" v-loading="loading" element-loading-background="rgba(122, 122, 122, .1)" @selection-change="handleSelectionChange" @row-click="rowSelectChange">
                    <el-table-column type="selection" width="55" />
                    <el-table-column prop="name" label="数据名称" minWidth="140" />
                    <el-table-column prop="invalidNum" label="无效数据" minWidth="100" />
                    <el-table-column prop="upNum" label="上传数据" minWidth="100" />
                    <el-table-column prop="sourceRepeatNum" label="源重复数据" minWidth="100" />
                    <el-table-column prop="repeatNum" label="账号内重复" minWidth="100" />
                    <el-table-column prop="intoNum" label="入库数量" minWidth="100" />
                    <el-table-column prop="residueNum" label="剩余数量" minWidth="100" />
                    <el-table-column prop="useStatus" label="数据状态" minWidth="100">
                        <template #default="scope">
                            <el-tag :type="scope.row.useStatus==1?'success':'warning'"> {{ dataOption[scope.row.useStatus] }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="upStatus" label="任务状态" minWidth="100">
                        <template  #default="scope">
                            <el-tag :type="scope.row.up_status==1?'warning':'success'"> {{ taskOption[scope.row.upStatus] }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="useStatus" label="评价" minWidth="130">
                        <template #default="scope">
                            <el-rate @click.stop v-model="scope.row.evaluate" size="large" :max="5" @change="setGarde($event,scope.row)" />
                        </template>
                    </el-table-column>
                    <el-table-column label="创建时间" width="160" >
                        <template #default="scope">{{ formatDate(scope.row.CreatedAt) }}</template>
                    </el-table-column>
                    <el-table-column label="操作" width="320">
                        <template #default="scope">
                            <el-popover placement="left" :width="200" trigger="click">
                                <span>剩余数据明细</span>
                                <div style="display: flex;justify-content: flex-end;">
                                    合计 {{remaParams.total}} 条
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
                                    <el-button :disabled="checkIdArry.length>0" type="primary" @click.stop="showLeaveNum(scope.row,1)" size="small" plain>剩余数量</el-button>
                                </template>
                            </el-popover>
                            <el-button :disabled="checkIdArry.length > 0" type="success" @click.stop="createDatabtn(scope.row,2)" size="small" plain>补充</el-button>
                            <el-button :disabled="checkIdArry.length>0" type="primary" @click.stop="downloadRecord(scope.row)" size="small" plain>下载记录</el-button>
                            <!-- <el-button :disabled="checkIdArry.length > 0" type="danger" style="margin-left:10px;" @click.stop="delFileBtn(scope.row, 2)" plain>删除</el-button> -->
                            <el-button :disabled="checkIdArry.length>0" size="small" :border="false" style="padding: 0;" @click.stop>
                                <el-dropdown @command="(command)=>{handleCommand(scope.row,command)}">
                                    <el-button type="primary" size="small">
                                        更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
                                    </el-button>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item :disabled="checkIdArry.length>0" v-for="(item,idx) in moreOption" :key="idx" :command="{label:item,idx:idx}">
                                            {{ item }}
                                            </el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
                    <el-pagination background @size-change="setPageSize" @current-change="switchPage"
                    :page-sizes="pageOption" :current-page.sync="dataParams.page" :page-size="dataParams.limit"
                    layout="total, sizes, prev, pager, next, jumper" :total="dataParams.total" style="padding-top: 0;margin-top: 10px;" />
            </div>
        </div>
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="400" :close-on-click-modal="false">
            <div>
                <el-form ref="dataRef" :model="dataForm" :rules="dataRules" label-width="auto">
                    <template v-if="dataForm.ptype">
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
                    </template>
                    <template v-else>
                        <el-form-item label="导出数量" prop="export_num">
                            <el-input v-model="dataForm.export_num" clearable />
                        </el-form-item>
                        <el-form-item label="备注">
                            <el-input v-model="dataForm.remark" clearable />
                        </el-form-item>
                    </template>
                    <el-form-item>
                        <div class="el-r-but">
                            <el-button @click="dialogVisible = false">取消</el-button>
                            <el-button v-if="dataForm.ptype" type="primary" :disabled="!dataForm.file_url" :loading="isLoading" @click="submitForm(dataRef)">确定</el-button>
                            <el-button v-else type="primary" :loading="isLoading" @click="submitForm(dataRef)">确定</el-button>
                        </div>
                    </el-form-item>
                </el-form>
            </div>
        </el-dialog>
        <el-dialog v-model="delParams.delVisible" title="提示" top="40vh" width="420" :close-on-click-modal="false">
            <div style="display:flex;align-items: center;"> 
                <el-icon size="21" color="#e6a23c"><WarningFilled /></el-icon>
                <span style="display:flex;margin-left: 5px;">{{ tipsContent }}</span>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="delParams.delVisible = false">取消</el-button>
                    <el-button type="primary" :loading="delParams.delLoading" @click="handleDelBtn">确定</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog v-model="downParams.showVisible" title="下载记录" width="760" :close-on-click-modal="false">
            <el-table :data="recordList" ref="dataTable" border height="600" v-loading="loading" element-loading-background="rgba(122, 122, 122, .1)" @selection-change="handleSelectionChange" @row-click="rowSelectChange">
                <el-table-column prop="num" label="数量" minWidth="100" />
                <el-table-column prop="remark" label="备注" minWidth="100" />
                <el-table-column label="创建时间" width="160" >
                    <template #default="scope">{{ formatDate(scope.row.CreatedAt) }}</template>
                </el-table-column>
                <el-table-column label="操作" width="130">
                    <template #default="scope">
                        <el-button type="primary" @click.stop="exportRecord(scope.row)" size="small" plain>导出下载记录</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="layui_page">
                <el-pagination background @size-change="recordPageSize" @current-change="recordLimitSize"
                    :page-sizes="pageOption" :current-page.sync="downParams.page" :page-size="downParams.limit"
                    layout="total, sizes, prev, pager, next, jumper" :total="downParams.total">
                </el-pagination>
            </div>
        </el-dialog>
    </div>
</template>

<script lang='ts' setup name='data_list'>
    import { reactive, ref, nextTick,computed  } from 'vue'
    import { successTips} from '@/core/global'
    import { formatDate } from '@/utils/format'
    import { FormInstance, FormRules} from 'element-plus'
    import { getDataList,createDataPack,upload,deleteDataPackByIds,getResidueNum,downloadList,setDataPackUseStatus,setDataPackEvaluate } from '@/api/data_list'
    interface dataStruct {
        ID:number,
        name: string
        file_url: string
        ptype:number
        comIdx: number
        remark: string
        export_num:number
    }
    let dataList = ref([])
    let recordList = ref([])
    let timer = ref(null)
    let lazyEle = ref(null)
    let dataTable = ref()
    let uploadRef = ref("")
    let dialogTitle = ref("上传数据")
    let isMore = ref(false)
    let loading = ref(false)
    let isLoading = ref(false)
    let moreLoading = ref(false)
    let dialogVisible = ref(false)
    let recoedLoading = ref(false)
    let tipsContent = ref("")
    const residueList = ref([])
    const checkIdArry = ref([])
    const sunmmary = ref([6,7])
    const dataRef = ref<FormInstance>()
    const { VITE_BASE_API} = import.meta.env;
    const taskOption = ref(["","上传中...","已完成"])
    const dataOption = ref(["","未使用","已使用"])
    const pageOption = ref([10, 20, 50, 100, 200, 500, 1000])
    const moreOption = ref(["导出全部数据","导出剩余数据","下载数据","设置为已使用"])
    const delParams = reactive({
        del_id:"",
        delVisible:false,
        delLoading:false,
        dialogType:null
    })
    const remaParams = reactive({
        page:0,
        limit:20,
        total:0,
        id:"",
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
        comIdx:null,
        file_url:"",
        ptype:null,
        remark:"",
        export_num:null
    })
    const downParams = reactive({
        id:"",
        page:1,
        limit:10,
        total:0,
        task_name:"",
        showVisible:false
    })
    const dataRules = reactive<FormRules<dataStruct>>({
        name: [
            { required: true, message: '请输入文件名称', trigger: 'blur' }
        ],
        export_num: [
            { required: true, message: '请输入导出数量', trigger: 'blur' }
        ]
    })
    const tableHeight = computed<number>(() => {
        return document.documentElement.clientHeight-240
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
    const getSummaries = (param?:any) => {
        const { columns, data } = param;
        const sums = [];
        columns.forEach((column, index) => {
            const values = data.map(item => Number(item[column.property]));
            if (index === 0) {
                sums[index] = "汇总";
                return;
            }else if(sunmmary.value.indexOf(index) > -1){
                sums[index] = values.reduce((prev, curr) => {
                    const value = Number(curr);
                    if (!isNaN(value)) {
                        return prev+curr;
                    } else {
                        return prev;
                    }
                },0);
            }else{
                sums[index] = '--';	
            }
        });
        return sums;
    }
    const showLeaveNum = async (row:any,page:number)=>{
        residueList.value=[];
        remaParams.id=row.ID;
        remaParams.page=page;
        moreLoading.value=true;
        let res:any = await getResidueNum({ID:row.ID,page:remaParams.page,pageSize:remaParams.limit})
        moreLoading.value=false;
        if (res.code !=0)return;
        let { total,list } = res.data;
        remaParams.total=total;
        residueList.value = list||[];
    }
    const lazyScroll = ()=>{
        const container = lazyEle.value
        let pageLen = Math.ceil(remaParams.total / remaParams.limit);
        clearTimeout(timer.value);
        if (container.scrollTop + container.clientHeight >= container.scrollHeight && pageLen > remaParams.page) {
            isMore.value = false;
            timer.value = setTimeout(() => {
                remaParams.page++
                getResidueNum({ID:remaParams.id,page:remaParams.page,pageSize:remaParams.limit}).then((res:any)=>{
                    if (res.code !=0)return;
                    residueList.value = [...residueList.value,...res.data.list]
                })
            }, 500);
        }else{
            timer.value = setTimeout(() => {
                isMore.value = true;
            }, 500);
            return;
        }
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
        tipsContent.value="确定要删除吗？"
        delParams.delVisible = true;
    }
    const downloadRecord = async (row:any)=>{
        recoedLoading.value=true;
        recordList.value=[];
        downParams.id=row.ID;
        downParams.page=1;
        await getRecordList();
        downParams.showVisible=true;
    }
    const getRecordList = async ()=>{
        let res:any = await downloadList({pack_id:downParams.id,page:downParams.page,pageSize:downParams.limit})
        recoedLoading.value=false;
        if (res.code !=0)return;
        let { total,list } = res.data;
        downParams.total=total;
        recordList.value = list||[];
    }

    const recordPageSize = (limit:number) => {
        downParams.page=1;
        downParams.limit = limit;
        getRecordList();
    }
    const recordLimitSize = (page:number) => {
        downParams.page = page;
        getRecordList();
    }
    const handleDelBtn = async() => {
        let params = {}
        if (delParams.dialogType) {
            delParams.dialogType==1?Reflect.set(params,"IDs",checkIdArry.value):Reflect.set(params,"IDs",[delParams.del_id]); 
        }else{
            Reflect.set(params,"pack_id",dataForm.ID)
        }
        delParams.delVisible = true;
        const reqApi = delParams.dialogType?deleteDataPackByIds:setDataPackUseStatus;
        const res:any = await reqApi(params);
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
        dialogTitle.value="上传数据";
        dialogVisible.value = true;
        await nextTick();
        if (type == 1) {
            dataRef.value?.resetFields()
            dataForm.name="";
            dataForm.file_url="";
        }
    }
    const handleCommand = async (row:any,command:any) => {
        dataForm.ptype=null;
        dataForm.remark="";
        if (command.idx==2) {
            dataForm.export_num=null;
            dataForm.ID=row?.ID||null;
            dialogTitle.value=command.label;
            dialogVisible.value = true;
        }else if(command.idx==3){
            delParams.dialogType=null;
            dataForm.ID=row?.ID||null;
            delParams.delVisible=true;
            dialogTitle.value=command.label;
            tipsContent.value="确定将该数据设为已使用？";
        }else{
            dataForm.comIdx=command.idx+1;
            const url = `${VITE_BASE_API}/dp/doOutPutData?pack_id=${row.ID}&ptype=${dataForm.comIdx}`
            window.location.href = url;
        }
    }
    const submitForm = async (formEl: FormInstance | undefined) => {
        if (!formEl) return;
        await formEl.validate(async(valid, fields) => {
            if (valid) {
                isLoading.value=true;
                if (dataForm.ptype) {
                    dataForm.ptype==1? delete dataForm.ID:"";
                    const res:any = await createDataPack(dataForm);
                    isLoading.value=false;
                    if (res.code !=0) return;
                }else{
                    const url = `${VITE_BASE_API}/dp/download?ID=${dataForm.ID}&Num=${dataForm.export_num}&remark=${dataForm.remark}`
                    window.location.href = url;
                }
                getDatalist(1)
                successTips();
                isLoading.value=false;
                dialogVisible.value = false;
            } else {
            console.log('error submit!', fields)
            }
        })
    }
    const exportRecord = async (row:any) => {
        const url = `${VITE_BASE_API}/dp/doOutDownloadRecord?download_id=${row.ID}`
        window.location.href = url;
    }
    const setGarde = async (num:any,row:any) => {
        const res:any = await setDataPackEvaluate({evaluate:num,pack_id:row.ID});
        if (res.code !=0) return;
        getDatalist(1)
        successTips();
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
