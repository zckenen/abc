package test;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.poi.hssf.usermodel.HSSFCell;
import org.apache.poi.hssf.usermodel.HSSFRow;
import org.apache.poi.hssf.usermodel.HSSFSheet;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import com.gt.prison.common.utils.IdGen;
import com.gt.prison.common.utils.TimeUtils;
import com.gt.prison.modules.axis.dao.CriminalDao;
import com.gt.prison.modules.axis.entity.AdmCriminal;

@RunWith(SpringJUnit4ClassRunner.class) // 表示继承了SpringJUnit4ClassRunner类
@ContextConfiguration(locations = "classpath*:/spring-context*.xml")
public class TestExcel {
	// 记录类的输出信息­
	static Log log = LogFactory.getLog(TestExcel.class);
	// 获取Excel文档的路径­
	public static String filePath = "C://Users/Lin/Desktop/数据文档/昆明/人员数据.xls";

	@Autowired
	private CriminalDao criminalDao;

	@Test
	public void test() {
		try {
			// 创建对Excel工作簿文件的引用­
			HSSFWorkbook wookbook = new HSSFWorkbook(new FileInputStream(filePath));
			// 在Excel文档中，第一张工作表的缺省索引是0
			// 其语句为：HSSFSheet sheet = workbook.getSheetAt(0);­
			HSSFSheet sheet = wookbook.getSheet("Sheet1");
			// 获取到Excel文件中的所有行数­
			int rows = sheet.getPhysicalNumberOfRows();
			// 遍历行­
			List<AdmCriminal> criList = new ArrayList<>();
			for (int i = 1; i < rows; i++) {
				// 读取左上端单元格­
				HSSFRow row = sheet.getRow(i);
				// 行不为空­
				if (row != null) {
					// 获取到Excel文件中的所有的列­
					int cells = row.getPhysicalNumberOfCells();
					String value = "";
					// 遍历列­
					for (int j = 0; j < cells; j++) {
						// 获取到列的值­
						HSSFCell cell = row.getCell(j);
						if (cell != null) {
							switch (cell.getCellType()) {
							case HSSFCell.CELL_TYPE_FORMULA:
								break;
							case HSSFCell.CELL_TYPE_NUMERIC:
								value += cell.getNumericCellValue() + ",";
								break;
							case HSSFCell.CELL_TYPE_STRING:
								value += cell.getStringCellValue() + ",";
								break;
							default:
								value += "0";
								break;
							}
						}
					}
					// 将数据插入到mysql数据库中­
					String[] val = value.split(",");
					AdmCriminal cri = new AdmCriminal();
					cri.setId(IdGen.uuid());
					cri.setCriNum(val[0].substring(0, val[0].indexOf(".")));
					cri.setCriXuhao(val[3].substring(0, val[3].indexOf(".")));
					cri.setCriCriminalname(val[4]);
					cri.setCriNation(val[5]);
					cri.setCriBrithday(TimeUtils.addTime(val[6]));
					cri.setCriHybd(val[8]);
					cri.setCriIdcard(val[9]);
					cri.setCriOrigin(val[10]);
					cri.setCriHomeaddress(val[11]);
					cri.setCriMonitoringtime(TimeUtils.addTime(val[17]));
					cri.setCriEnddate(TimeUtils.addTime(val[18]));
					cri.setCriTglb(TimeUtils.addTime(val[19]));
					cri.setCriWanwei(val[20]);
					cri.setCriCharge(val[21]);
					cri.setCriChargetype(val[22]);
					cri.setCriPrisonarea(val[24].substring(0, val[24].indexOf(".")));
					cri.setCriOrgnum(val[24].substring(0, val[24].indexOf(".")));
					cri.setCriZyaflb(val[25]);
					cri.setCriSslx(TimeUtils.addTime(val[26]));
					cri.setCriCriminalfacts(val[27]);
					
					/*
					 * AdmCriminalKunming criKun = new AdmCriminalKunming();
					 * criKun.setId(IdGen.uuid());
					 * criKun.setCriAllcount(val[0]);
					 * criKun.setCriCount(val[1]);
					 * criKun.setCriYearcount(val[2]);
					 * criKun.setCriRecord(val[3]); criKun.setCriName(val[4]);
					 * criKun.setCriNation(val[5]);
					 * criKun.setCriBrithday(val[6]);
					 * criKun.setCriCulture(val[7]);
					 * criKun.setCriMarriage(val[8]);
					 * criKun.setCriIdcard(val[9]);
					 * criKun.setCriOrigin(val[10]);
					 * criKun.setCriPolicestation(val[11]);
					 * criKun.setCriHomeaddress(val[12]);
					 * criKun.setCriIntime(val[13]);
					 * criKun.setCriJudicial(val[14]);
					 * criKun.setCriHandling(val[15]);
					 * criKun.setCriContact(val[16]);
					 * criKun.setCriStarttime(val[17]);
					 * criKun.setCriEndtime(val[18]);
					 * criKun.setCriFirsttime(val[19]);
					 * criKun.setCriTimes(val[20]); criKun.setCriDrugs(val[21]);
					 * criKun.setCriAddicts(val[22]);
					 * criKun.setCriJudicialnum(val[23]);
					 * criKun.setCriGroup(val[24]);
					 * criKun.setCriUnusual(val[25]);
					 * criKun.setCriUnusualtime(val[26]);
					 * criKun.setCriReason(val[27]);
					 */
					criList.add(cri);
					cri.preUpdate();
					if (criminalDao.updateCriminal(cri) != 1) {
						cri.preInsert();
						criminalDao.saveCriminalInfo(cri);// 罪犯信息新增
						criminalDao.savePeopleInfo(cri);// 人员信息新增
						// admCriminalChangeService.saveNew(cri);//
						// 新增信息到adm_criminal_change表
					} else {
						criminalDao.updatePeopleInfo(cri);// 更新人员表
					}
				}
			}
		} catch (FileNotFoundException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}