<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="auto">



      <el-form-item label="产品编码" prop="productCode">
        <el-input
          v-model="queryParams.productCode"
          placeholder="请输入产品编码"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="产品名称" prop="productName">
        <el-input
          v-model="queryParams.productName"
          placeholder="请输入产品名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="规格型号" prop="specModel">
        <el-input
          v-model="queryParams.specModel"
          placeholder="请输入规格型号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="条形码" prop="barcode">
        <el-input
          v-model="queryParams.barcode"
          placeholder="请输入条形码"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="供应商" prop="supplier">
        <el-input
          v-model="queryParams.supplier"
          placeholder="请输入供应商"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="单价" prop="price">
        <el-input
          v-model="queryParams.price"
          placeholder="请输入单价"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="库存数量" prop="stock">
        <el-input
          v-model="queryParams.stock"
          placeholder="请输入库存数量"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="产品类型" prop="productType">
        <el-select v-model="queryParams.productType" placeholder="请选择产品类型" clearable>
          <el-option
            v-for="dict in biz_product_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="产品等级" prop="grade">
        <el-select v-model="queryParams.grade" placeholder="请选择产品等级" clearable>
          <el-option
            v-for="dict in biz_product_grade"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="计量单位" prop="unit">
        <el-select v-model="queryParams.unit" placeholder="请选择计量单位" clearable>
          <el-option
            v-for="dict in biz_product_unit"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="产地" prop="origin">
        <el-select v-model="queryParams.origin" placeholder="请选择产地" clearable>
          <el-option
            v-for="dict in biz_product_origin"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="产品状态" prop="productStatus">
        <el-select v-model="queryParams.productStatus" placeholder="请选择产品状态" clearable>
          <el-option
            v-for="dict in biz_product_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="是否危险品" prop="isHazardous">
        <el-select v-model="queryParams.isHazardous" placeholder="请选择是否危险品" clearable>
          <el-option
            v-for="dict in biz_product_hazard"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!-- ⚠️ 兜底分支，不要删。理由同表单区：没配上就静默丢一个查询条件 -->
      <el-form-item label="产品标签" prop="tags">
        <el-input
          v-model="queryParams.tags"
          placeholder="请输入产品标签"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <!-- ⚠️ 兜底分支，不要删。理由同表单区：没配上就静默丢一个查询条件 -->
      <el-form-item label="适用场景" prop="scenes">
        <el-input
          v-model="queryParams.scenes"
          placeholder="请输入适用场景"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="生产日期" prop="produceDate">
        <el-date-picker clearable
          v-model="queryParams.produceDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择生产日期">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="上市日期" prop="launchDate">
        <el-date-picker clearable
          v-model="queryParams.launchDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择上市日期">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="每日盘点时间" prop="stocktakeTime">
        <el-time-picker clearable
          v-model="queryParams.stocktakeTime"
          value-format="HH:mm:ss"
          placeholder="请选择每日盘点时间">
        </el-time-picker>
      </el-form-item>
      <el-form-item label="入库时间" style="width: 308px" v-show="expandQuery">
        <el-date-picker
          v-model="daterangeInboundTime"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="过期时间" prop="expireTime">
        <el-date-picker clearable
          v-model="queryParams.expireTime"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择过期时间">
        </el-date-picker>
      </el-form-item>
      <!-- ⚠️ 兜底分支，不要删。理由同表单区：没配上就静默丢一个查询条件 -->
      <el-form-item label="产品主图" prop="coverImage">
        <el-input
          v-model="queryParams.coverImage"
          placeholder="请输入产品主图"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <!-- ⚠️ 兜底分支，不要删。理由同表单区：没配上就静默丢一个查询条件 -->
      <el-form-item label="产品图册" prop="galleryImages">
        <el-input
          v-model="queryParams.galleryImages"
          placeholder="请输入产品图册"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <!-- ⚠️ 兜底分支，不要删。理由同表单区：没配上就静默丢一个查询条件 -->
      <el-form-item label="规格书" prop="specFile">
        <el-input
          v-model="queryParams.specFile"
          placeholder="请输入规格书"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <!-- ⚠️ 兜底分支，不要删。理由同表单区：没配上就静默丢一个查询条件 -->
      <el-form-item label="质检报告" prop="reportFile">
        <el-input
          v-model="queryParams.reportFile"
          placeholder="请输入质检报告"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <!-- ⚠️ 兜底分支，不要删。理由同表单区：没配上就静默丢一个查询条件 -->
      <el-form-item label="相关附件" prop="manualFiles">
        <el-input
          v-model="queryParams.manualFiles"
          placeholder="请输入相关附件"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <!-- ⚠️ 兜底分支，不要删。理由同表单区：没配上就静默丢一个查询条件 -->
      <el-form-item label="产品描述" prop="detailContent">
        <el-input
          v-model="queryParams.detailContent"
          placeholder="请输入产品描述"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <!-- ⚠️ 兜底分支，不要删。理由同表单区：没配上就静默丢一个查询条件 -->
      <el-form-item label="适用年龄" prop="suitableAge">
        <el-input
          v-model="queryParams.suitableAge"
          placeholder="请输入适用年龄"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <!-- ⚠️ 兜底分支，不要删。理由同表单区：没配上就静默丢一个查询条件 -->
      <el-form-item label="含税单价" prop="unitPrice">
        <el-input
          v-model="queryParams.unitPrice"
          placeholder="请输入含税单价"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <!-- ⚠️ 兜底分支，不要删。理由同表单区：没配上就静默丢一个查询条件 -->
      <el-form-item label="调整金额" prop="adjustAmount">
        <el-input
          v-model="queryParams.adjustAmount"
          placeholder="请输入调整金额"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <!-- ⚠️ 兜底分支，不要删。理由同表单区：没配上就静默丢一个查询条件 -->
      <el-form-item label="折扣率" prop="discountRate">
        <el-input
          v-model="queryParams.discountRate"
          placeholder="请输入折扣率"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="是否推荐" prop="isRecommend">
        <el-switch v-model="queryParams.isRecommend" active-value="1" inactive-value="0" />
      </el-form-item>
      <el-form-item label="上市年月" prop="launchMonth">
        <el-date-picker clearable
          v-model="queryParams.launchMonth"
          type="month"
          value-format="YYYY-MM"
          placeholder="选择上市年月">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="上市年份" prop="launchYear">
        <el-date-picker clearable
          v-model="queryParams.launchYear"
          type="year"
          value-format="YYYY"
          placeholder="选择上市年份">
        </el-date-picker>
      </el-form-item>
      <!-- ⚠️ 兜底分支，不要删。理由同表单区：没配上就静默丢一个查询条件 -->
      <el-form-item label="产品评分" prop="starLevel">
        <el-input
          v-model="queryParams.starLevel"
          placeholder="请输入产品评分"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="联系电话" prop="contactPhone">
        <el-input
          v-model="queryParams.contactPhone"
          placeholder="请输入联系电话"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="联系邮箱" prop="contactEmail">
        <el-input
          v-model="queryParams.contactEmail"
          placeholder="请输入联系邮箱"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <!-- ⚠️ 兜底分支，不要删。理由同表单区：没配上就静默丢一个查询条件 -->
      <el-form-item label="使用说明" prop="instruction">
        <el-input
          v-model="queryParams.instruction"
          placeholder="请输入使用说明"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        <el-button link type="primary" :icon="expandQuery ? 'ArrowUp' : 'ArrowDown'" @click="toggleExpandQuery">{{ expandQuery ? '收起' : '展开查看更多' }}</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['biz:demoProduct:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['biz:demoProduct:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['biz:demoProduct:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['biz:demoProduct:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="demoProductList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="产品ID" align="center" prop="productId" min-width="100" />
      <el-table-column label="产品编码" align="center" prop="productCode" min-width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.productCode" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.productCode }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.productCode }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="产品名称" align="center" prop="productName" min-width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.productName" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.productName }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.productName }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="所属分类" align="center" prop="categoryId" min-width="100" />
      <el-table-column label="规格型号" align="center" prop="specModel" min-width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.specModel" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.specModel }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.specModel }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="条形码" align="center" prop="barcode" min-width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.barcode" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.barcode }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.barcode }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier" min-width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.supplier" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.supplier }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.supplier }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="单价" align="center" prop="price" min-width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.price" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.price }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.price }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="库存数量" align="center" prop="stock" min-width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.stock" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.stock }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.stock }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="产品类型" align="center" prop="productType" min-width="100">
        <template #default="scope">
          <dict-tag :options="biz_product_type" :value="scope.row.productType"/>
        </template>
      </el-table-column>
      <el-table-column label="产品等级" align="center" prop="grade" min-width="100">
        <template #default="scope">
          <dict-tag :options="biz_product_grade" :value="scope.row.grade"/>
        </template>
      </el-table-column>
      <el-table-column label="计量单位" align="center" prop="unit" min-width="100">
        <template #default="scope">
          <dict-tag :options="biz_product_unit" :value="scope.row.unit"/>
        </template>
      </el-table-column>
      <el-table-column label="产地" align="center" prop="origin" min-width="100">
        <template #default="scope">
          <dict-tag :options="biz_product_origin" :value="scope.row.origin"/>
        </template>
      </el-table-column>
      <el-table-column label="产品状态" align="center" prop="productStatus" min-width="100">
        <template #default="scope">
          <dict-tag :options="biz_product_status" :value="scope.row.productStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="是否危险品" align="center" prop="isHazardous" min-width="110">
        <template #default="scope">
          <dict-tag :options="biz_product_hazard" :value="scope.row.isHazardous"/>
        </template>
      </el-table-column>
      <el-table-column label="产品标签" align="center" prop="tags" min-width="150">
        <template #default="scope">
          <dict-tag :options="biz_product_tags" :value="scope.row.tags ? scope.row.tags.split(',') : []"/>
        </template>
      </el-table-column>
      <el-table-column label="适用场景" align="center" prop="scenes" min-width="150">
        <template #default="scope">
          <dict-tag :options="biz_product_scenes" :value="scope.row.scenes ? scope.row.scenes.split(',') : []"/>
        </template>
      </el-table-column>
      <el-table-column label="生产日期" align="center" prop="produceDate" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.produceDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="上市日期" align="center" prop="launchDate" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.launchDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="每日盘点时间" align="center" prop="stocktakeTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.stocktakeTime, '{h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="入库时间" align="center" prop="inboundTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.inboundTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="过期时间" align="center" prop="expireTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.expireTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="产品主图" align="center" prop="coverImage" width="100">
        <template #default="scope">
          <image-preview :src="scope.row.coverImage" :width="50" :height="50"/>
        </template>
      </el-table-column>
      <el-table-column label="产品图册" align="center" prop="galleryImages" width="100">
        <template #default="scope">
          <image-preview :src="scope.row.galleryImages" :width="50" :height="50"/>
        </template>
      </el-table-column>
      <el-table-column label="规格书" align="center" prop="specFile" min-width="100">
        <template #default="scope">
          <file-list :value="scope.row.specFile" label="规格书"/>
        </template>
      </el-table-column>
      <el-table-column label="质检报告" align="center" prop="reportFile" min-width="100">
        <template #default="scope">
          <file-list :value="scope.row.reportFile" label="质检报告"/>
        </template>
      </el-table-column>
      <el-table-column label="相关附件" align="center" prop="manualFiles" min-width="100">
        <template #default="scope">
          <file-list :value="scope.row.manualFiles" label="相关附件"/>
        </template>
      </el-table-column>
      <el-table-column label="产品描述" align="center" prop="detailContent" min-width="100">
        <template #default="scope">
          <el-button v-if="scope.row.detailContent" link type="primary" @click="handleViewRichText('产品描述', scope.row.detailContent)">查看</el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="适用年龄" align="center" prop="suitableAge" min-width="100" />
      <el-table-column label="含税单价" align="center" prop="unitPrice" min-width="100" />
      <el-table-column label="调整金额" align="center" prop="adjustAmount" min-width="100" />
      <el-table-column label="折扣率" align="center" prop="discountRate" min-width="100" />
      <el-table-column label="是否推荐" align="center" prop="isRecommend" min-width="100">
        <template #default="scope">
          <el-tag :type="scope.row.isRecommend === '1' ? 'success' : 'info'">{{ scope.row.isRecommend === '1' ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="上市年月" align="center" prop="launchMonth" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.launchMonth, '{y}-{m}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="上市年份" align="center" prop="launchYear" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.launchYear, '{y}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="产品评分" align="center" prop="starLevel" width="180">
        <template #default="scope">
          <!-- 用 :model-value 而不是 v-model —— 列表里不该改行数据 -->
          <el-rate :model-value="scope.row.starLevel" disabled />
        </template>
      </el-table-column>
      <el-table-column label="联系电话" align="center" prop="contactPhone" min-width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.contactPhone" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.contactPhone }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.contactPhone }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="联系邮箱" align="center" prop="contactEmail" min-width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.contactEmail" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.contactEmail }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.contactEmail }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="使用说明" align="center" prop="instruction" min-width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.instruction" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.instruction }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.instruction }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="100">
        <template #default="scope">
          <el-tooltip v-if="scope.row.remark" placement="top" :show-after="300">
            <template #content>
              <div style="max-width: 420px; white-space: pre-wrap; word-break: break-all;">{{ scope.row.remark }}</div>
            </template>
            <div class="cell-clamp2">{{ scope.row.remark }}</div>
          </el-tooltip>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="140">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['biz:demoProduct:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['biz:demoProduct:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改演示产品对话框 -->
    <el-dialog :title="title" v-model="open" width="1100px" append-to-body>
      <el-form ref="demoProductRef" :model="form" :rules="rules" label-width="auto">
        <el-row>
          <el-col :span="8">
            <el-form-item label="产品编码" prop="productCode">
              <el-input v-model="form.productCode" placeholder="请输入产品编码" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="产品名称" prop="productName">
              <el-input v-model="form.productName" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="所属分类" prop="categoryId">
              <!-- 选项来自规则里的 treeApi（一个返回树形列表的接口） -->
              <el-tree-select
                v-model="form.categoryId"
                :data="categoryIdOptions"
                :props="{ value: 'categoryId', label: 'categoryName', children: 'children' }"
                value-key="categoryId"
                placeholder="请选择所属分类"
                check-strictly
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="规格型号" prop="specModel">
              <el-input v-model="form.specModel" placeholder="请输入规格型号" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="条形码" prop="barcode">
              <el-input v-model="form.barcode" placeholder="请输入条形码" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="供应商" prop="supplier">
              <el-input v-model="form.supplier" placeholder="请输入供应商" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单价" prop="price">
              <el-input v-model="form.price" placeholder="请输入单价" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="库存数量" prop="stock">
              <el-input v-model="form.stock" placeholder="请输入库存数量" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="产品类型" prop="productType">
              <el-select v-model="form.productType" placeholder="请选择产品类型">
                <el-option
                  v-for="dict in biz_product_type"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="产品等级" prop="grade">
              <el-select v-model="form.grade" placeholder="请选择产品等级">
                <el-option
                  v-for="dict in biz_product_grade"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="计量单位" prop="unit">
              <el-select v-model="form.unit" placeholder="请选择计量单位">
                <el-option
                  v-for="dict in biz_product_unit"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="产地" prop="origin">
              <el-select v-model="form.origin" placeholder="请选择产地">
                <el-option
                  v-for="dict in biz_product_origin"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="产品状态" prop="productStatus">
              <el-radio-group v-model="form.productStatus">
                <el-radio
                  v-for="dict in biz_product_status"
                  :key="dict.value"
                  :label="dict.value"
                >{{dict.label}}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="是否危险品" prop="isHazardous">
              <el-radio-group v-model="form.isHazardous">
                <el-radio
                  v-for="dict in biz_product_hazard"
                  :key="dict.value"
                  :label="dict.value"
                >{{dict.label}}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="产品标签" prop="tags">
              <el-checkbox-group v-model="form.tags">
                <el-checkbox
                  v-for="dict in biz_product_tags"
                  :key="dict.value"
                  :label="dict.value">
                  {{dict.label}}
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="适用场景" prop="scenes">
              <el-checkbox-group v-model="form.scenes">
                <el-checkbox
                  v-for="dict in biz_product_scenes"
                  :key="dict.value"
                  :label="dict.value">
                  {{dict.label}}
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="生产日期" prop="produceDate">
              <el-date-picker clearable
                v-model="form.produceDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择生产日期">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="上市日期" prop="launchDate">
              <el-date-picker clearable
                v-model="form.launchDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择上市日期">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="每日盘点时间" prop="stocktakeTime">
              <el-time-picker clearable
                v-model="form.stocktakeTime"
                value-format="HH:mm:ss"
                placeholder="请选择每日盘点时间">
              </el-time-picker>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="入库时间" prop="inboundTime">
              <el-date-picker clearable
                v-model="form.inboundTime"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择入库时间">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="过期时间" prop="expireTime">
              <el-date-picker clearable
                v-model="form.expireTime"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择过期时间">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="产品主图" prop="coverImage">
              <!-- 约束来自 validation_rule（JSON）：limit 数量上限（1=单个，>1=多个）、
                   fileSize 单文件大小(MB)、fileType 允许的扩展名。
                   没配规则时这些属性**不会生成**，产物与改造前完全一致。
                   配法：UPDATE gen_table_column SET validation_rule =
                         '{"limit":5,"fileSize":5,"fileType":"png,jpg"}' WHERE ...
              -->
              <image-upload v-model="form.coverImage" :limit="1" :file-size="2" :file-type="['png','jpg']"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="产品图册" prop="galleryImages">
              <!-- 约束来自 validation_rule（JSON）：limit 数量上限（1=单个，>1=多个）、
                   fileSize 单文件大小(MB)、fileType 允许的扩展名。
                   没配规则时这些属性**不会生成**，产物与改造前完全一致。
                   配法：UPDATE gen_table_column SET validation_rule =
                         '{"limit":5,"fileSize":5,"fileType":"png,jpg"}' WHERE ...
              -->
              <image-upload v-model="form.galleryImages" :limit="5" :file-size="5" :file-type="['png','jpg','jpeg']"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="规格书" prop="specFile">
              <!-- 约束来自 validation_rule（JSON）：limit 数量上限（1=单个，>1=多个）、
                   fileSize 单文件大小(MB)、fileType 允许的扩展名。
                   没配规则时这些属性**不会生成**，产物与改造前完全一致。
                   配法：UPDATE gen_table_column SET validation_rule =
                         '{"limit":5,"fileSize":5,"fileType":"png,jpg"}' WHERE ...
              -->
              <file-upload v-model="form.specFile" :limit="1" :file-size="10" :file-type="['pdf','doc','docx']"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="质检报告" prop="reportFile">
              <!-- 约束来自 validation_rule（JSON）：limit 数量上限（1=单个，>1=多个）、
                   fileSize 单文件大小(MB)、fileType 允许的扩展名。
                   没配规则时这些属性**不会生成**，产物与改造前完全一致。
                   配法：UPDATE gen_table_column SET validation_rule =
                         '{"limit":5,"fileSize":5,"fileType":"png,jpg"}' WHERE ...
              -->
              <file-upload v-model="form.reportFile" :limit="1" :file-size="10" :file-type="['pdf','doc','docx']"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="相关附件" prop="manualFiles">
              <!-- 约束来自 validation_rule（JSON）：limit 数量上限（1=单个，>1=多个）、
                   fileSize 单文件大小(MB)、fileType 允许的扩展名。
                   没配规则时这些属性**不会生成**，产物与改造前完全一致。
                   配法：UPDATE gen_table_column SET validation_rule =
                         '{"limit":5,"fileSize":5,"fileType":"png,jpg"}' WHERE ...
              -->
              <file-upload v-model="form.manualFiles" :limit="3" :file-size="10" :file-type="['pdf','doc','docx','xls','xlsx']"/>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="产品描述">
              <editor v-model="form.detailContent" :min-height="192"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="适用年龄" prop="suitableAge">
              <!-- 数值控件。上下限/步长/小数位来自 validation_rule：
                   {"min":0,"max":150,"precision":0} 之类。没配就不生成对应属性。

                   ⚠️ 判空用的是 Velocity 的「安静引用」（美元符号后跟叹号，把 null
                   渲染成空串再跟空串比），**不能图省事写成真值判断** —— Velocity 里
                   **0 是假值**，那样 min=0 这类配置会被静默吞掉（本项目真实踩过）。

                   ⚠️ 本注释里不要出现「井号 + 指令名」：Velocity 连 HTML 注释里的
                   指令也会解析，写了会让整个模板解析失败（也真实踩过）。 -->
              <el-input-number v-model="form.suitableAge" :min="0" :max="150" :precision="0" placeholder="请输入适用年龄" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="含税单价" prop="unitPrice">
              <!-- 数值控件。上下限/步长/小数位来自 validation_rule：
                   {"min":0,"max":150,"precision":0} 之类。没配就不生成对应属性。

                   ⚠️ 判空用的是 Velocity 的「安静引用」（美元符号后跟叹号，把 null
                   渲染成空串再跟空串比），**不能图省事写成真值判断** —— Velocity 里
                   **0 是假值**，那样 min=0 这类配置会被静默吞掉（本项目真实踩过）。

                   ⚠️ 本注释里不要出现「井号 + 指令名」：Velocity 连 HTML 注释里的
                   指令也会解析，写了会让整个模板解析失败（也真实踩过）。 -->
              <el-input-number v-model="form.unitPrice" :min="0" :precision="2" placeholder="请输入含税单价" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="调整金额" prop="adjustAmount">
              <!-- 数值控件。上下限/步长/小数位来自 validation_rule：
                   {"min":0,"max":150,"precision":0} 之类。没配就不生成对应属性。

                   ⚠️ 判空用的是 Velocity 的「安静引用」（美元符号后跟叹号，把 null
                   渲染成空串再跟空串比），**不能图省事写成真值判断** —— Velocity 里
                   **0 是假值**，那样 min=0 这类配置会被静默吞掉（本项目真实踩过）。

                   ⚠️ 本注释里不要出现「井号 + 指令名」：Velocity 连 HTML 注释里的
                   指令也会解析，写了会让整个模板解析失败（也真实踩过）。 -->
              <el-input-number v-model="form.adjustAmount" :precision="2" placeholder="请输入调整金额" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="折扣率" prop="discountRate">
              <!-- 数值控件。上下限/步长/小数位来自 validation_rule：
                   {"min":0,"max":150,"precision":0} 之类。没配就不生成对应属性。

                   ⚠️ 判空用的是 Velocity 的「安静引用」（美元符号后跟叹号，把 null
                   渲染成空串再跟空串比），**不能图省事写成真值判断** —— Velocity 里
                   **0 是假值**，那样 min=0 这类配置会被静默吞掉（本项目真实踩过）。

                   ⚠️ 本注释里不要出现「井号 + 指令名」：Velocity 连 HTML 注释里的
                   指令也会解析，写了会让整个模板解析失败（也真实踩过）。 -->
              <el-input-number v-model="form.discountRate" :min="0" :max="100" :precision="2" placeholder="请输入折扣率" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="是否推荐" prop="isRecommend">
              <!-- 开关。存储用 char(1) 的 '0'/'1'，所以 active-value 要给字符串，
                   给布尔会把 1/0 写成 true/false -->
              <el-switch v-model="form.isRecommend" active-value="1" inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="上市年月" prop="launchMonth">
              <el-date-picker clearable
                v-model="form.launchMonth"
                type="month"
                value-format="YYYY-MM"
                placeholder="请选择上市年月">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="上市年份" prop="launchYear">
              <el-date-picker clearable
                v-model="form.launchYear"
                type="year"
                value-format="YYYY"
                placeholder="请选择上市年份">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="产品评分" prop="starLevel">
              <el-rate v-model="form.starLevel" :max="5" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="联系邮箱" prop="contactEmail">
              <el-input v-model="form.contactEmail" placeholder="请输入联系邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="使用说明" prop="instruction">
              <el-input v-model="form.instruction" type="textarea" placeholder="请输入内容" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
    <!-- 富文本查看：单元格里放富文本会撑高行且几乎不可读，改用按钮 + 弹窗 -->
    <el-dialog v-model="richTextDialog.visible" :title="richTextDialog.title" width="800px" append-to-body>
      <div class="rich-text-body" v-html="richTextDialog.html"></div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="DemoProduct">
import type { BizDemoProduct, DemoProductQueryParams } from "@/types/api/biz/demoProduct"
import { listDemoProduct, getDemoProduct, delDemoProduct, addDemoProduct, updateDemoProduct } from "@/api/biz/demoProduct"
import request from '@/utils/request'

const { proxy } = getCurrentInstance()
const { biz_product_hazard, biz_product_unit, biz_product_type, biz_product_origin, biz_product_grade, biz_product_scenes, biz_product_tags, biz_product_status } = useDict('biz_product_hazard', 'biz_product_unit', 'biz_product_type', 'biz_product_origin', 'biz_product_grade', 'biz_product_scenes', 'biz_product_tags', 'biz_product_status')

const demoProductList = ref<BizDemoProduct[]>([])
const open = ref<boolean>(false)
const loading = ref<boolean>(true)
const showSearch = ref<boolean>(true)
/** 查看富文本内容。
 *  用 v-html 渲染，依赖后端 HTMLFilter 在入库时已过滤（默认开启，见 @@MAVEN_ARTIFACT_PREFIX@@-common 的 HTMLFilter）。 */
const richTextDialog = reactive({ visible: false, title: '', html: '' })
function handleViewRichText(title: string, html: string) {
  richTextDialog.title = title
  richTextDialog.html = html || ''
  richTextDialog.visible = true
}
// 「展开查看更多」开关。控制非常用查询条件的显隐（模板里用 v-show 挂在 el-form-item 上，
// 而不是 v-if —— 这样 resetQuery 的 resetForm 仍能收集到被折叠的字段，
// 否则会出现「看不见但仍在生效」的筛选条件）
const expandQuery = ref<boolean>(false)
const ids = ref<number[]>([])
const single = ref<boolean>(true)
const multiple = ref<boolean>(true)
const total = ref<number>(0)
const title = ref<string>("")
const daterangeInboundTime = ref<string[]>([])

const data = reactive({
  form: {} as BizDemoProduct,
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    productCode: undefined,
    productName: undefined,
    specModel: undefined,
    barcode: undefined,
    supplier: undefined,
    price: undefined,
    stock: undefined,
    productType: undefined,
    grade: undefined,
    unit: undefined,
    origin: undefined,
    productStatus: undefined,
    isHazardous: undefined,
    tags: undefined,
    scenes: undefined,
    produceDate: undefined,
    launchDate: undefined,
    stocktakeTime: undefined,
    inboundTime: undefined,
    expireTime: undefined,
    coverImage: undefined,
    galleryImages: undefined,
    specFile: undefined,
    reportFile: undefined,
    manualFiles: undefined,
    detailContent: undefined,
    suitableAge: undefined,
    unitPrice: undefined,
    adjustAmount: undefined,
    discountRate: undefined,
    isRecommend: undefined,
    launchMonth: undefined,
    launchYear: undefined,
    starLevel: undefined,
    contactPhone: undefined,
    contactEmail: undefined,
    instruction: undefined,
  } as DemoProductQueryParams,
  rules: {
    productCode: [
      { required: true, message: "产品编码不能为空", trigger: "blur" }
    ],
    contactPhone: [
      { pattern: new RegExp("^1[3-9]\\d{9}$"), message: "手机号格式不正确", trigger: "blur" }
    ],
    contactEmail: [
      { pattern: new RegExp("^[\\w.+-]+@[\\w-]+\\.[A-Za-z]{2,}$"), message: "邮箱格式不正确", trigger: "blur" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 展开/收起非常用查询条件 */
function toggleExpandQuery() {
  expandQuery.value = !expandQuery.value
  // 右侧 RightToolbar 的放大镜在收起/展开整个搜索区时，会在 el-form 上留下内联的
  // max-height 且不保证清理掉（它的 setTimeout 调度在双层 requestAnimationFrame 之外，
  // 存在竞态）。而本页的「展开查看更多」会改变表单高度，一旦那个过期的 max-height 还在，
  // 新增的那一行就会被截断、点了没反应。这里主动清一次，代价可忽略。
  nextTick(() => {
    // 取 el-form 的根元素。**必须走 proxy.$refs** —— 模板里 ref="queryRef" 并不会
    // 在 <script setup> 里自动生成一个 queryRef 变量（除非显式 const queryRef = ref()），
    // 直接写 queryRef.value 会抛 ReferenceError。上游各页面统一用 proxy.$refs["xxx"]。
    const form = (proxy?.$refs["queryRef"] as { $el?: HTMLElement } | undefined)?.$el
    if (form && form.style.maxHeight) {
      form.style.maxHeight = ''
      form.style.overflow = ''
      form.style.transition = ''
      form.style.opacity = ''
    }
  })
}

/** 查询演示产品列表 */
function getList() {
  loading.value = true
  queryParams.value.params = {}
  if (daterangeInboundTime.value.length > 0) {
    queryParams.value.params["beginInboundTime"] = daterangeInboundTime.value[0]
    queryParams.value.params["endInboundTime"] = daterangeInboundTime.value[1]
  }
  listDemoProduct(queryParams.value).then(response => {
    demoProductList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}

/** 表单重置 */
function reset() {
  form.value = {
    productId: null,
    productCode: null,
    productName: null,
    categoryId: null,
    specModel: null,
    barcode: null,
    supplier: null,
    price: null,
    stock: null,
    productType: null,
    grade: null,
    unit: null,
    origin: null,
    productStatus: null,
    isHazardous: null,
    tags: [],
    scenes: [],
    produceDate: null,
    launchDate: null,
    stocktakeTime: null,
    inboundTime: null,
    expireTime: null,
    coverImage: null,
    galleryImages: null,
    specFile: null,
    reportFile: null,
    manualFiles: null,
    detailContent: null,
    suitableAge: null,
    unitPrice: null,
    adjustAmount: null,
    discountRate: null,
    isRecommend: null,
    launchMonth: null,
    launchYear: null,
    starLevel: null,
    contactPhone: null,
    contactEmail: null,
    instruction: null,
    delFlag: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null
  }
  proxy.resetForm("demoProductRef")
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  daterangeInboundTime.value = []
  proxy.resetForm("queryRef")
  handleQuery()
}

/** 多选框选中数据 */
function handleSelectionChange(selection: BizDemoProduct[]) {
  ids.value = selection.map(item => item.productId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 加载「所属分类」的树形选项 */
const categoryIdOptions = ref<any[]>([])
function loadCategoryIdOptions() {
  request({ url: "/biz/demoCategory/list", method: "get" }).then((res: any) => {
    const list = (res && (res.data || res.rows)) || []
    categoryIdOptions.value = proxy.handleTree(list, "categoryId", "parentId") || []
  })
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  loadCategoryIdOptions()
  open.value = true
  title.value = "添加演示产品"
}

/** 修改按钮操作 */
function handleUpdate(row: BizDemoProduct) {
  reset()
  loadCategoryIdOptions()
  const _productId = row.productId || ids.value[0]
  getDemoProduct(_productId).then(response => {
    form.value = response.data
    form.value.tags = form.value.tags.split(",")
    form.value.scenes = form.value.scenes.split(",")
    open.value = true
    title.value = "修改演示产品"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["demoProductRef"].validate((valid: boolean) => {
    if (valid) {
      form.value.tags = form.value.tags.join(",")
      form.value.scenes = form.value.scenes.join(",")
      if (form.value.productId != null) {
        updateDemoProduct(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addDemoProduct(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 删除按钮操作 */
function handleDelete(row: BizDemoProduct) {
  const _productIds = row.productId || ids.value
  proxy.$modal.confirm('是否确认删除演示产品编号为"' + _productIds + '"的数据项？').then(function() {
    return delDemoProduct(_productIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('biz/demoProduct/export', {
    ...queryParams.value
  }, `demoProduct_${new Date().getTime()}.xlsx`)
}

getList()
</script>

<style scoped lang="scss">
/* 长文本单元格：最多两行，超出用省略号。完整内容由 el-tooltip 展示。
   注意 tooltip 的 popper 是 teleport 到 body 的，scoped 样式够不到它，
   所以那段宽度/换行控制写在列定义的**内联 style** 上。 */
.cell-clamp2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 富文本查看弹窗。v-html 的内容不会被 scoped 加属性，内部元素要用 :deep() */
.rich-text-body {
  max-height: 60vh;
  overflow: auto;
  line-height: 1.7;

  :deep(img) {
    max-width: 100%;
  }
}
</style>
