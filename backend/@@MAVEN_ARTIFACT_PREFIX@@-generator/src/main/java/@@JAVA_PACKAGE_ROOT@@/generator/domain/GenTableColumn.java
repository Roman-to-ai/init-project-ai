package @@JAVA_PACKAGE_ROOT@@.generator.domain;

import jakarta.validation.constraints.NotBlank;
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import @@JAVA_PACKAGE_ROOT@@.common.core.domain.BaseEntity;
import @@JAVA_PACKAGE_ROOT@@.common.utils.StringUtils;

/**
 * 代码生成业务字段表 gen_table_column
 */
public class GenTableColumn extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 编号 */
    private Long columnId;

    /** 归属表编号 */
    private Long tableId;

    /** 列名称 */
    private String columnName;

    /** 列描述 */
    private String columnComment;

    /** 列类型 */
    private String columnType;

    /** JAVA类型 */
    private String javaType;

    /** JAVA字段名 */
    @NotBlank(message = "Java属性不能为空")
    private String javaField;

    /** 是否主键（1是） */
    private String isPk;

    /** 是否自增（1是） */
    private String isIncrement;

    /** 是否必填（1是） */
    private String isRequired;

    /** 是否为插入字段（1是） */
    private String isInsert;

    /** 是否编辑字段（1是） */
    private String isEdit;

    /** 是否列表字段（1是） */
    private String isList;

    /** 是否查询字段（1是） */
    private String isQuery;

    /** 是否常用查询条件（1是）。生成的页面里常用条件直接显示，非常用条件折叠 */
    private String isCommon;

    /**
     * 校验规则（JSON）。承载 DDL 表达不了的那些约束：
     * 长度 / 正则 / 数值范围 / 精度 / 是否允许负数 / 文件数量与大小 …
     *
     * <p>为什么用一个 JSON 列而不是加一堆列：加一个列属性要改 6 处
     * （DDL、实体、两个 Mapper.xml 共 7 个位置、GenUtils、synchDb 白名单），
     * 漏一处是**静默失效**。加 10 个约束列就是 60 处改动；一个 JSON 列只要 6 处，
     * 而且将来加新约束不必再动 DDL 与 Mapper。
     *
     * <p>示例：{"required":true,"maxLength":64,"pattern":"^[A-Z0-9-]+$"}
     * <br>　　　{"limit":5,"fileSize":5,"fileType":"png,jpg"}（多图）
     */
    private String validationRule;

    /** 解析后的规则对象，懒加载。transient —— 不参与序列化，也不落库 */
    private transient JSONObject ruleCache;

    /** 查询方式（EQ等于、NE不等于、GT大于、LT小于、LIKE模糊、BETWEEN范围） */
    private String queryType;

    /** 显示类型（input文本框、textarea文本域、select下拉框、checkbox复选框、radio单选框、datetime日期控件、image图片上传控件、upload文件上传控件、editor富文本控件） */
    private String htmlType;

    /** 字典类型 */
    private String dictType;

    /** 排序 */
    private Integer sort;

    public void setColumnId(Long columnId)
    {
        this.columnId = columnId;
    }

    public Long getColumnId()
    {
        return columnId;
    }

    public void setTableId(Long tableId)
    {
        this.tableId = tableId;
    }

    public Long getTableId()
    {
        return tableId;
    }

    public void setColumnName(String columnName)
    {
        this.columnName = columnName;
    }

    public String getColumnName()
    {
        return columnName;
    }

    public void setColumnComment(String columnComment)
    {
        this.columnComment = columnComment;
    }

    public String getColumnComment()
    {
        return columnComment;
    }

    public void setColumnType(String columnType)
    {
        this.columnType = columnType;
    }

    public String getColumnType()
    {
        return columnType;
    }

    public void setJavaType(String javaType)
    {
        this.javaType = javaType;
    }

    public String getJavaType()
    {
        return javaType;
    }

    public void setJavaField(String javaField)
    {
        this.javaField = javaField;
    }

    public String getJavaField()
    {
        return javaField;
    }

    public String getCapJavaField()
    {
        return StringUtils.capitalize(javaField);
    }

    public void setIsPk(String isPk)
    {
        this.isPk = isPk;
    }

    public String getIsPk()
    {
        return isPk;
    }

    public boolean isPk()
    {
        return isPk(this.isPk);
    }

    public boolean isPk(String isPk)
    {
        return isPk != null && StringUtils.equals("1", isPk);
    }

    public String getIsIncrement()
    {
        return isIncrement;
    }

    public void setIsIncrement(String isIncrement)
    {
        this.isIncrement = isIncrement;
    }

    public boolean isIncrement()
    {
        return isIncrement(this.isIncrement);
    }

    public boolean isIncrement(String isIncrement)
    {
        return isIncrement != null && StringUtils.equals("1", isIncrement);
    }

    public void setIsRequired(String isRequired)
    {
        this.isRequired = isRequired;
    }

    public String getIsRequired()
    {
        return isRequired;
    }

    public boolean isRequired()
    {
        return isRequired(this.isRequired);
    }

    public boolean isRequired(String isRequired)
    {
        return isRequired != null && StringUtils.equals("1", isRequired);
    }

    public void setIsInsert(String isInsert)
    {
        this.isInsert = isInsert;
    }

    public String getIsInsert()
    {
        return isInsert;
    }

    public boolean isInsert()
    {
        return isInsert(this.isInsert);
    }

    public boolean isInsert(String isInsert)
    {
        return isInsert != null && StringUtils.equals("1", isInsert);
    }

    public void setIsEdit(String isEdit)
    {
        this.isEdit = isEdit;
    }

    public String getIsEdit()
    {
        return isEdit;
    }

    public boolean isEdit()
    {
        return isInsert(this.isEdit);
    }

    public boolean isEdit(String isEdit)
    {
        return isEdit != null && StringUtils.equals("1", isEdit);
    }

    public void setIsList(String isList)
    {
        this.isList = isList;
    }

    public String getIsList()
    {
        return isList;
    }

    public boolean isList()
    {
        return isList(this.isList);
    }

    public boolean isList(String isList)
    {
        return isList != null && StringUtils.equals("1", isList);
    }

    public void setIsQuery(String isQuery)
    {
        this.isQuery = isQuery;
    }

    public String getIsQuery()
    {
        return isQuery;
    }

    public boolean isQuery()
    {
        return isQuery(this.isQuery);
    }

    public boolean isQuery(String isQuery)
    {
        return isQuery != null && StringUtils.equals("1", isQuery);
    }

    public void setIsCommon(String isCommon)
    {
        this.isCommon = isCommon;
    }

    public String getIsCommon()
    {
        return isCommon;
    }

    /**
     * 无参 version 是必须的 —— Velocity 模板里写 #if(!$column.common) 靠的就是它。
     * 少了这个方法，$column.common 取不到值，模板判断会静默失效。
     */
    public boolean isCommon()
    {
        return isCommon(this.isCommon);
    }

    public boolean isCommon(String isCommon)
    {
        return isCommon != null && StringUtils.equals("1", isCommon);
    }

    public void setValidationRule(String validationRule)
    {
        this.validationRule = validationRule;
        this.ruleCache = null;
    }

    public String getValidationRule()
    {
        return validationRule;
    }

    /**
     * 解析规则 JSON。解析失败时**不让生成过程整体失败**，退回「无约束」。
     * 一条规则写坏不该导致整个模块生成不出来。
     */
    private JSONObject rule()
    {
        if (ruleCache == null)
        {
            ruleCache = new JSONObject();
            if (StringUtils.isNotEmpty(validationRule))
            {
                try
                {
                    JSONObject parsed = JSON.parseObject(validationRule);
                    if (parsed != null)
                    {
                        ruleCache = parsed;
                    }
                }
                catch (Exception ignored)
                {
                }
            }
        }
        return ruleCache;
    }

    /*
     * ── 以下 getter 供 Velocity 模板直接取用（如 $column.ruleLimit）──
     *
     * 模板没有 JSON 解析能力，所以在这里解析好、以普通字段暴露出去。
     * **每加一种模板要用的规则，就在这里补一个 getter** —— 这是这套设计的代价，
     * 换来的是「加约束不用动 DDL 和 Mapper」。
     */

    /** 文件数量上限：1 = 单文件/单图，>1 = 多文件/多图。模板据此生成 :limit */
    public Integer getRuleLimit()
    {
        return rule().getInteger("limit");
    }

    /** 单文件大小上限（MB）。模板据此生成 :file-size */
    public Integer getRuleFileSize()
    {
        return rule().getInteger("fileSize");
    }

    /** 允许的扩展名，逗号分隔（如 png,jpg）。模板据此生成 :file-type */
    public String getRuleFileType()
    {
        return rule().getString("fileType");
    }

    /**
     * 允许的扩展名，**已格式化成 JS 数组字面量**（如 <code>['png','jpg']</code>）。
     *
     * <p>为什么要多这一个 getter：Velocity 里写不出数组字面量，直接
     * <code>${column.ruleFileType.split(',')}</code> 会渲染成
     * <code>[Ljava.lang.String;@1234</code>。用 #foreach 拼又会引入换行，
     * 落进 Vue 属性里变成脏空白。所以在这里拼好。
     *
     * <p>单引号会被剥掉 —— 规则来自配置，不能让它截断属性值。
     */
    public String getRuleFileTypeJs()
    {
        String v = getRuleFileType();
        if (StringUtils.isEmpty(v))
        {
            return null;
        }
        StringBuilder sb = new StringBuilder("[");
        String[] arr = v.split(",");
        for (int i = 0; i < arr.length; i++)
        {
            String ext = arr[i].trim().replace("'", "").replace("\"", "");
            if (ext.isEmpty())
            {
                continue;
            }
            if (sb.length() > 1)
            {
                sb.append(",");
            }
            sb.append("'").append(ext).append("'");
        }
        return sb.append("]").toString();
    }

    /** 最大长度。模板据此生成前端 rules（后端由校验解释器读同一份规则） */
    public Integer getRuleMaxLength()
    {
        return rule().getInteger("maxLength");
    }

    // ── 数值类（htmlType = "number" 时模板用来生成 el-input-number）──

    /** 最小值 */
    public Integer getRuleMin()
    {
        return rule().getInteger("min");
    }

    /** 最大值 */
    public Integer getRuleMax()
    {
        return rule().getInteger("max");
    }

    /** 步长 */
    public Integer getRuleStep()
    {
        return rule().getInteger("step");
    }

    /** 小数位数。0 = 只允许整数 */
    public Integer getRulePrecision()
    {
        return rule().getInteger("precision");
    }

    // ── 格式类（手机号 / 邮箱 / 身份证 / 网址 等，都是 input + 正则约束）──

    /** 正则表达式（原始值，后端校验解释器用同一份） */
    public String getRulePattern()
    {
        return rule().getString("pattern");
    }

    /** 正则失败时的提示语 */
    public String getRulePatternMessage()
    {
        String m = rule().getString("patternMessage");
        return StringUtils.isEmpty(m) ? "格式不正确" : m;
    }

    /**
     * 正则，**已转成 JS 字符串字面量**（含引号，反斜杠与引号已转义）。
     *
     * <p>模板里写成 <code>pattern: new RegExp(${column.rulePatternJs})</code>。
     * 用 <code>new RegExp("...")</code> 而不是 <code>/.../</code>：
     * 正则里若有 <code>/</code> 会截断字面量，而字符串形式没有这个问题。
     */
    public String getRulePatternJs()
    {
        String p = getRulePattern();
        if (StringUtils.isEmpty(p))
        {
            return null;
        }
        return "\"" + p.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    /** 提示语，**已转成 JS 字符串字面量**（含引号） */
    public String getRulePatternMessageJs()
    {
        if (StringUtils.isEmpty(getRulePattern()))
        {
            return null;
        }
        return "\"" + getRulePatternMessage().replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    // ── 选择类控件的选项来源（htmlType = select / radio / checkbox）──
    //   三种来源，优先级：dict_type（字典）> options（写死）> optionsApi（接口）
    //   规则形如 {"options":[{"label":"启用","value":"1"},{"label":"停用","value":"0"}]}
    //          {"optionsApi":"/biz/demoCategory/list","optionLabel":"categoryName","optionValue":"categoryId"}
    //
    //   ⚠️ 这几个键**不参与后端校验** —— FieldRule 忽略不认识的键（它只认 required/min/max/
    //      pattern 那些），所以选项来源放在同一个 validation_rule 列里不会互相干扰。
    //      该列实际上是「字段扩展配置」，不只是校验规则。

    /**
     * 写死的选项，**已格式化成可直接内联的 JS 数组字面量**：
     * <code>[{ label: '启用', value: '1' }, { label: '停用', value: '0' }]</code>
     *
     * <p>为什么要在这里拼：与 {@link #getRuleFileTypeJs()} 同理 —— Velocity 写不出
     * 数组/对象字面量，用 #foreach 拼又会引入换行，落进 script 里变成脏空白。
     *
     * <p>没有配置时返回 null，模板据此判断「这个字段该用哪个来源」。
     */
    public String getRuleOptionsJs()
    {
        JSONArray arr = rule().getJSONArray("options");
        if (arr == null || arr.isEmpty())
        {
            return null;
        }
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < arr.size(); i++)
        {
            JSONObject o = arr.getJSONObject(i);
            if (o == null || o.getString("value") == null)
            {
                continue;
            }
            if (sb.length() > 1)
            {
                sb.append(", ");
            }
            sb.append("{ label: '").append(jsEscape(o.getString("label")))
              .append("', value: '").append(jsEscape(o.getString("value"))).append("' }");
        }
        return sb.append("]").toString();
    }

    /** 选项接口地址。与 dict_type / options 三选一，优先级最低 */
    public String getRuleOptionsApi()
    {
        return rule().getString("optionsApi");
    }

    /** 接口返回里当 label 用的字段名，不配默认 label */
    public String getRuleOptionLabel()
    {
        String v = rule().getString("optionLabel");
        return StringUtils.isEmpty(v) ? "label" : v;
    }

    /** 接口返回里当 value 用的字段名，不配默认 value */
    public String getRuleOptionValue()
    {
        String v = rule().getString("optionValue");
        return StringUtils.isEmpty(v) ? "value" : v;
    }

    /** 转义成单引号 JS 字符串的内容部分（防截断、防换行混进 script） */
    private static String jsEscape(String s)
    {
        if (s == null)
        {
            return "";
        }
        return s.replace("\\", "\\\\").replace("'", "\\'").replace("\r", "").replace("\n", "\\n");
    }

    /**
     * 是否多选 —— {@code select} 与 {@code treeselect} 共用。
     *
     * <p>它们只是**同一个组件多一个 prop**，所以用规则开关而不是新增 htmlType：
     * 新增一个 htmlType 要改两套模板的各 3 个区块，而这里只需在已有分支里加个属性。
     */
    public Boolean getRuleMultiple()
    {
        return rule().getBoolean("multiple");
    }

    /**
     * 是否「多值字段」：checkbox / 多选 select、treeselect / 图片 / 附件。
     *
     * <p>四者存盘都是**逗号分隔的多值串**（{@code varchar}），而**线上形状统一是 JSON 数组** ——
     * 差异由 {@code @MultiValue} 在 Jackson 边界上收口，所以模板只需认这一个判据：
     * 前端提交不 join、回显不 split、reset 给 {@code []}，后端出参入参自动转换。
     *
     * <p>图片与附件也算多值，是因为 {@code ImageUpload} / {@code FileUpload} 两个组件的
     * {@code v-model} 本来就能是数组（数组进数组出）—— 它们的列表渲染才需要逗号串。
     *
     * <p>这是**派生判据**，不落库、不进「加一个列属性要改 6 处」那份清单。
     */
    public boolean isMultiValue()
    {
        return "checkbox".equals(htmlType)
                || "imageUpload".equals(htmlType)
                || "fileUpload".equals(htmlType)
                || Boolean.TRUE.equals(getRuleMultiple());
    }

    /**
     * 查询区是否出**多选**控件。
     *
     * <p>多值列里只有「**有选项来源**」（字典 / 写死 options / 接口 optionsApi）的那些能出多选；
     * 图片、附件这类没有来源的多值列在查询区只能退化成单值文本框。
     *
     * <p>这个判据必须由模板共用：`index.vue.vm` 用它决定查询条件的**初值**（{@code []} 还是
     * {@code undefined}），`type.ts.vm` 用它决定 {@code QueryParams} 的类型（{@code string[]} 还是
     * {@code string}）—— 两边条件各写一份就会对不上，vue-tsc 会报 TS2352。
     */
    public boolean isMultiSelectQuery()
    {
        return isMultiValue()
                && (StringUtils.isNotEmpty(dictType)
                        || StringUtils.isNotEmpty(getRuleOptionsJs())
                        || StringUtils.isNotEmpty(getRuleOptionsApi())
                        // treeselect 的选项来自 treeApi，不属于上面三种来源；配了 multiple 时
                        // 查询区同样要出数组（否则初值与 TS 类型会对不上，vue-tsc 报 TS2352）
                        || "treeselect".equals(htmlType));
    }

    // ── 树选择（htmlType = "treeselect"）：选项来自某个返回树形列表的接口 ──
    //   规则形如 {"treeApi":"/biz/demoCategory/list","valueField":"categoryId",
    //             "labelField":"categoryName","parentField":"parentId"}

    /** 树选项的接口地址 */
    public String getRuleTreeApi()
    {
        return rule().getString("treeApi");
    }

    /** 树节点的取值字段（对应 handleTree 的 id 字段） */
    public String getRuleTreeValueField()
    {
        return rule().getString("valueField");
    }

    /** 树节点的显示字段 */
    public String getRuleTreeLabelField()
    {
        return rule().getString("labelField");
    }

    /** 父节点字段（对应 handleTree 的 parentId 字段） */
    public String getRuleTreeParentField()
    {
        return rule().getString("parentField");
    }

    // ── 冗余显示列：关联字段旁边再存一份「可读名称」，列表/查询/导出直接吃它 ──
    //   规则示例：
    //   {"treeApi":"/biz/demoCategory/list","valueField":"categoryId","labelField":"categoryName",
    //    "parentField":"parentId",
    //    "displayColumn":"categoryName",     ← 存到本表的哪一列（写 javaField）
    //    "refTable":"biz_demo_category",     ← 关联表名，后端那条路要
    //    "refValueColumn":"category_id",     ← 关联表的**数据库列名**（SQL 子查询要；
    //    "refLabelColumn":"category_name"}      注意与 valueField/labelField 不是一回事 ——
    //                                            那两个是接口返回的 JSON 键，给前端用）

    /** 本表存关联对象名称的列（javaField）。空 = 这个字段不用冗余显示列 */
    public String getRuleDisplayColumn()
    {
        return rule().getString("displayColumn");
    }

    /** 关联表名 —— 生成期写进 SQL 子查询用，前端不需要 */
    public String getRuleRefTable()
    {
        return rule().getString("refTable");
    }

    /** 关联表的**取值列**（数据库列名） */
    public String getRuleRefValueColumn()
    {
        return rule().getString("refValueColumn");
    }

    /** 关联表的**名称列**（数据库列名） */
    public String getRuleRefLabelColumn()
    {
        return rule().getString("refLabelColumn");
    }

    /** 关联对象的**取值**键（接口返回的 JSON 键，前端反查名称用） */
    public String getRuleRefValueField()
    {
        String valueField = getRuleTreeValueField();
        if (StringUtils.isNotEmpty(valueField))
        {
            return valueField;
        }
        String optionValue = getRuleOptionValue();
        return StringUtils.isNotEmpty(optionValue) ? optionValue : "value";
    }

    /** 关联对象的**名称**键（接口返回的 JSON 键，前端反查名称用） */
    public String getRuleRefLabelField()
    {
        String labelField = getRuleTreeLabelField();
        if (StringUtils.isNotEmpty(labelField))
        {
            return labelField;
        }
        String optionLabel = getRuleOptionLabel();
        return StringUtils.isNotEmpty(optionLabel) ? optionLabel : "label";
    }

    /** 配了「存到本表哪列」—— 前端据此在提交时把名称写进去 */
    public boolean isRefDisplay()
    {
        // ⚠️ 走辅助表的多对多要把自己排除掉：那种模式下配置就挂在**显示列本身**上
        // （`displayColumn` 指的是它自己），按「关联字段 + 冗余显示列」那套处理会变成自己指向自己 ——
        // 列表会跳过这一列、INSERT 会拿它自己的值去当关联 id。
        return !isJunction() && StringUtils.isNotEmpty(getRuleDisplayColumn());
    }

    /**
     * 后端那条路能否生成 SQL 子查询：显示列 + 关联表名 + 两个**数据库列名**都得有。
     *
     * <p>缺一个就**不生成**（前端那条照旧）—— 宁可少一份名称，也不生成一条跑不通的 SQL：
     * 把接口的 JSON 键（`categoryName`）当列名写进 `select`，MySQL 只会报 Unknown column。
     */
    public boolean isRefDisplaySql()
    {
        return isRefDisplay() && StringUtils.isNotEmpty(getRuleRefTable())
                && StringUtils.isNotEmpty(getRuleRefValueColumn()) && StringUtils.isNotEmpty(getRuleRefLabelColumn());
    }

    // ── 多对多：关联关系由**辅助表**维护（本表没有那一列） ──
    //   规则挂在「显示列」上，示例：
    //   {"junctionTable":"biz_product_tag",   ← 辅助表
    //    "junctionMainFk":"product_id",       ← 它指向本表的外键（数据库列名）
    //    "junctionRefFk":"tag_id",            ← 它指向关联表的外键
    //    "idsField":"tagIds",                 ← 实体上的瞬时字段（库里没有）
    //    "optionsApi":"/biz/demoTag/list","optionLabel":"tagName","optionValue":"tagId",
    //    "displayColumn":"tagNames",          ← 名称存本表哪一列
    //    "refTable":"biz_demo_tag","refValueColumn":"tag_id","refLabelColumn":"tag_name"}

    /** 辅助表（中间表）名 */
    public String getRuleJunctionTable()
    {
        return rule().getString("junctionTable");
    }

    /** 辅助表指向**本表**的外键（数据库列名） */
    public String getRuleJunctionMainFk()
    {
        return rule().getString("junctionMainFk");
    }

    /** 辅助表指向**关联表**的外键（数据库列名） */
    public String getRuleJunctionRefFk()
    {
        return rule().getString("junctionRefFk");
    }

    /** 实体上的瞬时字段名（存关联 id 集合，库里没有这一列） */
    public String getRuleIdsField()
    {
        return rule().getString("idsField");
    }

    /** idsField 首字母大写，用来拼 setter / getter / Mapper 方法名 */
    public String getIdsFieldCap()
    {
        String field = getRuleIdsField();
        if (StringUtils.isEmpty(field))
        {
            return "";
        }
        if (field.length() > 2 && Character.isUpperCase(field.charAt(1)))
        {
            return field;
        }
        return field.substring(0, 1).toUpperCase() + field.substring(1);
    }

    /** 是否走「辅助表维护的多对多」（四个键都得给全，缺一个就不生成） */
    public boolean isJunction()
    {
        return StringUtils.isNotEmpty(getRuleJunctionTable()) && StringUtils.isNotEmpty(getRuleJunctionMainFk())
                && StringUtils.isNotEmpty(getRuleJunctionRefFk()) && StringUtils.isNotEmpty(getRuleIdsField());
    }

    // ── 表格选择器：关联字段在查询区/表单区用一个「弹窗 + 表格」来选 ──
    //   规则示例：{"treeApi":"…","valueField":"categoryId","labelField":"categoryName",
    //              "parentField":"parentId",
    //              "pickerColumns":"分类名称:categoryName|编码:categoryCode"}
    //   用 `|` 分隔，每段是 `字段名` 或 `标签:字段名`；不配则选择器只显示名称列。

    /** 表格选择器要展示的列（原始串） */
    public String getRulePickerColumns()
    {
        return rule().getString("pickerColumns");
    }

    /** 是否用表格选择器：`treeselect` 默认就用；选项来自接口（`optionsApi`）的要显式配 `pickerColumns` */
    public boolean isPickerSelect()
    {
        return "treeselect".equals(htmlType) || StringUtils.isNotEmpty(getRulePickerColumns());
    }

    /** 见 {@link #getRulePickerColumns()} —— 解析成模板直接能用的 `[{label, prop}]` */
    public java.util.List<java.util.Map<String, String>> getRulePickerColumnList()
    {
        java.util.List<java.util.Map<String, String>> list = new java.util.ArrayList<java.util.Map<String, String>>();
        String raw = getRulePickerColumns();
        if (StringUtils.isEmpty(raw))
        {
            return list;
        }
        for (String item : raw.split("\\|"))
        {
            String piece = item.trim();
            if (piece.isEmpty())
            {
                continue;
            }
            // 支持 `字段名`、`标签:字段名`、`标签:字段名:字典类型`（第三段是字典，用来把 0/1 显示成标签）
            String[] parts = piece.split(":");
            String label;
            String prop;
            String dictType = "";
            if (parts.length == 1)
            {
                label = prop = parts[0].trim();
            }
            else
            {
                label = parts[0].trim();
                prop = parts[1].trim();
                if (parts.length > 2)
                {
                    dictType = parts[2].trim();
                }
            }
            if (prop.isEmpty())
            {
                continue;
            }
            java.util.Map<String, String> col = new java.util.LinkedHashMap<String, String>();
            col.put("label", label);
            col.put("prop", prop);
            if (!dictType.isEmpty())
            {
                col.put("dictType", dictType);
            }
            list.add(col);
        }
        return list;
    }

    // ── 逻辑删除标记（gen_table.options.softDelete）不在这里：那是**表级**开关，
    //    由 VelocityUtils.genSoftDelete + hasDelFlag 判定后放进 $softDelete。

    /** javaField 首字母大写，用来拼函数名（load${AttrName}Options）。与模板里的算法一致 */
    public String getAttrName()
    {
        if (StringUtils.isEmpty(javaField))
        {
            return "";
        }
        if (javaField.length() > 2 && Character.isUpperCase(javaField.charAt(1)))
        {
            return javaField;
        }
        return javaField.substring(0, 1).toUpperCase() + javaField.substring(1);
    }

    /** 必填。JSON 里有就以后者为准，没有则回退到 is_required */
    public boolean isRuleRequired()
    {
        Boolean r = rule().getBoolean("required");
        return r != null ? r : isRequired();
    }

    public void setQueryType(String queryType)
    {
        this.queryType = queryType;
    }

    public String getQueryType()
    {
        return queryType;
    }

    public String getHtmlType()
    {
        return htmlType;
    }

    public void setHtmlType(String htmlType)
    {
        this.htmlType = htmlType;
    }

    public void setDictType(String dictType)
    {
        this.dictType = dictType;
    }

    public String getDictType()
    {
        return dictType;
    }

    public void setSort(Integer sort)
    {
        this.sort = sort;
    }

    public Integer getSort()
    {
        return sort;
    }

    public boolean isSuperColumn()
    {
        return isSuperColumn(this.javaField);
    }

    public static boolean isSuperColumn(String javaField)
    {
        return StringUtils.equalsAnyIgnoreCase(javaField,
                // BaseEntity
                "createBy", "createTime", "updateBy", "updateTime", "remark",
                // 软删标志：逻辑删除时由后端管，前端新增/编辑表单不出现
                "delFlag",
                // TreeEntity
                "parentName", "parentId", "orderNum", "ancestors");
    }

    public boolean isUsableColumn()
    {
        return isUsableColumn(javaField);
    }

    public static boolean isUsableColumn(String javaField)
    {
        // isSuperColumn()中的名单用于避免生成多余Domain属性，若某些属性在生成页面时需要用到不能忽略，则放在此处白名单
        return StringUtils.equalsAnyIgnoreCase(javaField, "parentId", "orderNum", "remark");
    }

    public String readConverterExp()
    {
        String remarks = StringUtils.substringBetween(this.columnComment, "（", "）");
        StringBuffer sb = new StringBuffer();
        if (StringUtils.isNotEmpty(remarks))
        {
            for (String value : remarks.split(" "))
            {
                if (StringUtils.isNotEmpty(value))
                {
                    Object startStr = value.subSequence(0, 1);
                    String endStr = value.substring(1);
                    sb.append("").append(startStr).append("=").append(endStr).append(",");
                }
            }
            return sb.deleteCharAt(sb.length() - 1).toString();
        }
        else
        {
            return this.columnComment;
        }
    }
}
