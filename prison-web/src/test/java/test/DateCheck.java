package test;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import com.gt.prison.modules.mongo.entity.AlarmLoc;
import com.gt.prison.modules.mongo.entity.AlarmLocS;
import com.gt.prison.modules.mongo.entity.IntLoc;
import com.gt.prison.modules.mongo.service.AlarmLocService;
import com.gt.prison.modules.redis.config.RedisGlobal;
import com.gt.prison.modules.redis.service.imp.RedisBaseImp;
import com.gt.prison.modules.test.dao.AdmLocareaAboutDao;
import com.gt.prison.modules.test.dao.IntAlarmLocDao;
import com.gt.prison.modules.test.dao.IntAlarmLocSDao;
import com.gt.prison.modules.test.entity.AdmLocareaAbout;
import com.gt.prison.modules.test.entity.IntAlarmLoc;
import com.gt.prison.modules.test.entity.IntAlarmLocS;

import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath*:/spring-context*.xml")
public class DateCheck {

	@Autowired
	private AdmLocareaAboutDao admLocareaAboutDao;

	@Autowired
	private IntAlarmLocDao intAlarmLocDao;

	@Autowired
	private IntAlarmLocSDao intAlarmLocSDao;

	@Autowired
	private RedisBaseImp redisBaseImp;

	@Autowired
	private AlarmLocService alarmLocService;

	@Autowired
	private JedisPool slaveJedisPool;

	/**
	 * Mongo数据丢包、重复测试--所有手环
	 */
	// @Test
	public void allLostForMongo() {
		String sTime = "2017-05-18 17:00:00";
		String eTime = "2017-05-18 20:00:00";
		Jedis jedis = slaveJedisPool.getResource();
		// Redis获取所有腕带ID
		Set<String> ss = jedis.smembers(RedisGlobal.WATID);
		for (String s : ss) {
			System.out.println("腕带：【" + s + "】");
			// 单个腕带的丢失信息
			oneLostForMongo(Integer.parseInt(s), sTime, eTime);
			System.out.println("===========================");
		}
	}

	/**
	 * Mongo数据历史轨迹测试--所有手环
	 */
	// @Test
	public void allHistoryForMongo() {
		String sTime = "2017-05-17 17:00:00";
		String eTime = "2017-05-17 20:00:00";
		Jedis jedis = slaveJedisPool.getResource();
		// Redis获取所有腕带ID
		Set<String> ss = jedis.smembers(RedisGlobal.WATID);
		for (String s : ss) {
			System.out.println("腕带：【" + s + "】");
			// 单个腕带的轨迹信息
			oneHistoryForMongo(Integer.parseInt(s), sTime, eTime, jedis);
			System.out.println("===========================");
		}
	}

	/**
	 * 测试区域跨度跳变-mongo--所有手环
	 */
	@Test
	public void allJumpForMongo() {
		String sTime = "2017-05-17 20:00:00";
		String eTime = "2017-05-18 06:00:00";
		Jedis jedis = slaveJedisPool.getResource();
		Set<String> ss = jedis.smembers(RedisGlobal.WATID);
		Set<String> b = new HashSet<>();
		for (String s : ss) {
			System.out.println("腕带：【" + s + "】");
			if (!oneJumpForMongo(Integer.parseInt(s), sTime, eTime, jedis)) {
				b.add(s);
			}
			System.out.println("===========================");
		}
		System.out.println(b.toString());
	}

	/**
	 * 首页人数核对
	 */
	// @Test
	public void peoNum() {
		List<AlarmLoc> alarmLocList = redisBaseImp.hgetAllLocs();// 获取Redis里所有腕带定位信息
		System.out.println(alarmLocList.size());
		int zer = 0, you = 0, hua = 0, yun = 0, pu = 0;
		for (AlarmLoc loc : alarmLocList) {
			if ("1".equals(loc.getAllType())) {
				pu++;
				System.out.println(loc.getAllLocid() + " " + loc.getAllRunningState() + " " + loc.getAllWorkingState());
			}
			if ("0".equals(loc.getAllLocid())) {
				zer++;
				if (loc.getAllWorkingState() == 0) {
					hua++;
				}
				if (loc.getAllRunningState() == 0) {
					yun++;
				}
			} else {
				you++;
			}
		}
		System.out.println("0区域：" + zer + " 有区域：" + you + " 工作状态0：" + hua + " 运行状态0：" + yun + " 普犯：" + pu);
	}

	/**
	 * 测试区域跨度跳变-mongo
	 * 
	 * @param eTime
	 * @param sTime
	 * @param watchId
	 * @param jedis
	 */
	// @Test
	public boolean oneJumpForMongo(int watchId, String sTime, String eTime, Jedis jedis) {
		// int watchId = 16744;
		// String sTime = "2017-05-17 12:11:59";
		// String eTime = "2017-05-17 17:20:10";
		String locId = null;
		String locid = null;
		Set<String> ss = new HashSet<>();
		// 获取所有相关区域
		List<AdmLocareaAbout> locAboutList = admLocareaAboutDao.findList(new AdmLocareaAbout());
		Criteria cr = new Criteria();
		// 条件 手环id 大于时间 小于时间
		cr.and("allWatid").is(watchId).andOperator(Criteria.where("allTimestamp").gte(sTime),
				Criteria.where("allTimestamp").lte(eTime));
		Query query = new Query(cr);
		// 倒序
		query.with(new Sort(Direction.ASC, "allTimestamp"));
		// mongo查询
		List<IntLoc> alarmLocList = alarmLocService.findByConditionss(query, IntLoc.class);
		List<IntLoc> listMap = new ArrayList<>();
		for (IntLoc alarmLoc : alarmLocList) {
			if (alarmLoc.getAllLocid().equals(locid)) {
				continue;
			} else {
				locid = alarmLoc.getAllLocid();
				if (!"0".equals(alarmLoc.getAllLocid())) {
					listMap.add(alarmLoc);
				}
			}
		}
		if (listMap.size() == 0) {
			System.out.println("没有关于腕带【" + watchId + "】的数据！");
			return false;
		}
		for (IntLoc loc : listMap) {
			if (ss.size() > 0) {
				if (!ss.contains(loc.getAllLocid())) {
					System.out.println("腕带:【" + watchId + "】,从区域:【" + jedis.get("COO" + locId) + "】跳变到区域:【"
							+ jedis.get("COO" + loc.getAllLocid()) + "】,跳变时间：【" + loc.getAllTimestamp() + "】,可去区域："
							+ ss.toString());
					// locId=null;
				}
			}
			locId = loc.getAllLocid();
			ss = findAboutLocId(locAboutList, loc.getAllLocid());
		}
		return true;
	}

	/**
	 * 测试区域跨度跳变-Mysql
	 */

	public void oneJumpForMysql() {
		String watchId = "16390";
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		String locId = null;
		Set<String> ss = new HashSet<>();
		// 获取所有相关区域
		List<AdmLocareaAbout> locAboutList = admLocareaAboutDao.findList(new AdmLocareaAbout());
		// 得到某个腕带的历史轨迹
		IntAlarmLoc alaLoc = new IntAlarmLoc();
		alaLoc.setAllwatid(watchId);
		List<IntAlarmLoc> alaLocList = intAlarmLocDao.findList(alaLoc);
		if (alaLocList.size() == 0) {
			System.out.println("没有关于腕带【" + watchId + "】的数据！");
		}
		for (IntAlarmLoc loc : alaLocList) {
			if (ss.size() > 0) {
				if (!ss.contains(loc.getAlllocid())) {
					System.out.println("腕带:【" + watchId + "】,从区域:【" + locId + "】跳变到区域:【" + loc.getAlllocid()
							+ "】,跳变时间：【" + formatter.format(loc.getAlltimestamp()) + "】,可去区域：" + ss.toString());
					// locId=null;
				}
			}
			locId = loc.getAlllocid();
			ss = findAboutLocId(locAboutList, loc.getAlllocid());
		}

	}

	public Set<String> findAboutLocId(List<AdmLocareaAbout> locAboutList, String locId) {
		String[] strs = new String[] {};
		for (AdmLocareaAbout locAbout : locAboutList) {
			if (locId.equals(locAbout.getId())) {
				strs = locAbout.getAboutloc().split(",");
			}
		}
		Set<String> ss = new HashSet<>(Arrays.asList(strs));
		return ss;
	}

	/**
	 * 查找指定区域内的所有腕带ID
	 */

	public void findWatid() {
		List<AlarmLoc> alarmLocList = redisBaseImp.hgetAllLocs();// 获取Redis里所有腕带定位信息
		for (AlarmLoc alarmLoc : alarmLocList) {
			if ("3".equals(alarmLoc.getAllLocid())) {
				System.out.println(alarmLoc.getAllWatid());
			}
		}
	}

	/**
	 * 历史轨迹查看区域跳变-Mysql
	 */

	public void oneHistoryForMysql() {
		String watchId = "110";
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		IntAlarmLoc alaLoc = new IntAlarmLoc();
		alaLoc.setAllwatid(watchId);
		List<IntAlarmLoc> alaLocList = intAlarmLocDao.findList(alaLoc);
		for (IntAlarmLoc loc : alaLocList) {
			System.out.println("腕带：【" + watchId + "】,区域：【" + loc.getAlllocid() + "】,时间：【"
					+ formatter.format(loc.getAlltimestamp()) + "】");
		}
	}

	/**
	 * 历史轨迹查看区域跳变-Mongo
	 * 
	 * @param jedis
	 */
	// @Test
	public void oneHistoryForMongo(int watchId, String sTime, String eTime, Jedis jedis) {
		// int watchId = 16744;
		String locid = null;
		Criteria cr = new Criteria();
		// 条件 手环id 大于时间 小于时间
		cr.and("allWatid").is(watchId).andOperator(Criteria.where("allTimestamp").gte(sTime),
				Criteria.where("allTimestamp").lte(eTime));
		Query query = new Query(cr);
		// 正序
		query.with(new Sort(Direction.ASC, "allTimestamp"));
		// mongo查询
		List<IntLoc> alarmLocList = alarmLocService.findByConditionss(query, IntLoc.class);

		List<IntLoc> listMap = new ArrayList<>();
		// 去掉小区域和0区域
		for (IntLoc alarmLoc : alarmLocList) {
			if (alarmLoc.getAllLocid().equals(locid)) {
				continue;
			} else {
				locid = alarmLoc.getAllLocid();
				if (!"0".equals(alarmLoc.getAllLocid())) {
					listMap.add(alarmLoc);
				}
			}
		}
		if (listMap.size() == 0) {
			System.out.println("没有关于腕带【" + watchId + "】的数据！");
		}
		for (IntLoc loc : listMap) {
			System.out.println("腕带：【" + watchId + "】,区域：【" + jedis.get("COO" + loc.getAllLocid()) + "】,时间：【"
					+ loc.getAllTimestamp() + "】");
		}
	}

	/**
	 * Mysql数据丢包、重复测试
	 */
	// @Test
	public void oneLostForMysql() {
		String watchId = "16744";
		String sTime = "2017-05-17 09:50:49";
		String eTime = "2017-05-17 09:59:48";
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		IntAlarmLocS locs = new IntAlarmLocS();
		locs.setAllwatid(watchId);
		locs.setsTime(sTime);
		locs.seteTime(eTime);
		List<IntAlarmLocS> alaLocSList = intAlarmLocSDao.findListByTime(locs);
		Calendar calendar = Calendar.getInstance();
		try {
			calendar.setTime(formatter.parse(sTime));
		} catch (ParseException e1) {
			e1.printStackTrace();
		}
		long s = calendar.getTimeInMillis();
		try {
			calendar.setTime(formatter.parse(eTime));
		} catch (ParseException e1) {
			e1.printStackTrace();
		}
		long e = calendar.getTimeInMillis();
		System.out.println((e - s) / 1000);
		long interval = (e - s) / 1000 + 1;

		long beforTime = 0;
		long nowTime;
		if (alaLocSList.size() == interval) {
			System.err.println("数据没有重复");
			for (IntAlarmLocS los : alaLocSList) {
				nowTime = los.getAlltimestamp().getTime();
				if (beforTime != 0) {
					if ((nowTime - beforTime) / 1000 == 1) {

					} else if ((nowTime - beforTime) / 1000 > 1) {
						System.out.println("相邻2条数据相差大于1秒，从【" + formatter.format(los.getAlltimestamp()) + "】开始！");
					} else if ((nowTime - beforTime) / 1000 == 0) {
						System.out.println("时间【重复】，从【" + formatter.format(los.getAlltimestamp()) + "】开始!");
					} else {
						System.out.println("时间【错乱】，从【" + formatter.format(los.getAlltimestamp()) + "】开始！");
					}
				} else {
					if (nowTime == s) {
						System.out.println("数据正确，从【" + sTime + "】开始测试！");
					} else {
						System.out.println("第一条数据和开始时间对不上！");
					}
				}
				beforTime = nowTime;
			}
		} else {
			System.err.println("数据有重复，时间【" + ((e - s) / 1000 + 1) + "】秒，数据产生【" + alaLocSList.size() + "】条！");
			for (IntAlarmLocS los : alaLocSList) {
				nowTime = los.getAlltimestamp().getTime();
				if (beforTime != 0) {
					if ((nowTime - beforTime) / 1000 == 1) {

					} else if ((nowTime - beforTime) / 1000 > 1) {
						System.out.println("相邻2条数据相差大于1秒，从【" + formatter.format(los.getAlltimestamp()) + "】开始！");
					} else if ((nowTime - beforTime) / 1000 == 0) {
						System.out.println("时间【重复】，从【" + formatter.format(los.getAlltimestamp()) + "】开始!");
					} else {
						System.out.println("时间>>错乱<<，从【" + formatter.format(los.getAlltimestamp()) + "】开始！");
					}
				} else {
					if (nowTime == s) {
						System.out.println("数据正确，从【" + sTime + "】开始测试！");
					} else {
						System.out.println("第一条数据和开始时间对不上！");
					}
				}
				beforTime = nowTime;
			}
		}
	}

	/**
	 * Mongo数据丢包、重复测试
	 * 
	 * @param jedis
	 */
	// @Test
	public void oneLostForMongo(int watchId, String sTime, String eTime) {
		// int watchId = 16744;
		// String sTime = "2017-05-17 16:30:00";
		// String eTime = "2017-05-17 17:00:00";
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Criteria cr = new Criteria();
		// 条件 手环id 大于时间 小于时间
		cr.and("allWatid").is(watchId).andOperator(Criteria.where("allTimestamp").gte(sTime),
				Criteria.where("allTimestamp").lte(eTime));
		Query query = new Query(cr);
		// 正序
		query.with(new Sort(Direction.ASC, "allTimestamp"));
		// query.with(new Sort(Direction.ASC, "allSerialNum"));
		// System.out.println(query);
		// mongo查询
		// System.out.println(query);
		// 查询mongo返回AlarmLocS实体集合
		List<AlarmLocS> alarmLocList = alarmLocService.findByConditions(query, AlarmLocS.class);

		Calendar calendar = Calendar.getInstance();
		try {
			calendar.setTime(formatter.parse(sTime));
		} catch (ParseException e1) {
			e1.printStackTrace();
		}
		long s = calendar.getTimeInMillis();
		try {
			calendar.setTime(formatter.parse(eTime));
		} catch (ParseException e1) {
			e1.printStackTrace();
		}
		long e = calendar.getTimeInMillis();
		// System.out.println((e - s) / 1000);
		long interval = (e - s) / 1000 + 1;

		long beforTime = 0;
		long nowTime = 0;
		// 判断结果条数是否等于时间差
		if (alarmLocList.size() == interval) {
			System.err.println("数据没有重复");
			forAlarmLocSList(alarmLocList, formatter, calendar, beforTime, nowTime, s, sTime, eTime);
		} else {
			System.err.println("数据有重复或丢失，数据应产生【" + interval + "】条，实际产生【" + alarmLocList.size() + "】条！丢包率：【"
					+ (interval - alarmLocList.size()) + "】条");
			forAlarmLocSList(alarmLocList, formatter, calendar, beforTime, nowTime, s, sTime, eTime);
		}

	}

	public void forAlarmLocSList(List<AlarmLocS> alarmLocList, SimpleDateFormat formatter, Calendar calendar,
			long beforTime, long nowTime, long s, String sTime, String eTime) {
		for (AlarmLocS los : alarmLocList) {
			try {
				calendar.setTime(formatter.parse(los.getAllTimestamp()));
			} catch (ParseException e1) {
				e1.printStackTrace();
			}
			nowTime = calendar.getTimeInMillis();
			if (beforTime != 0) {
				if ((nowTime - beforTime) / 1000 == 1) {

				} else if ((nowTime - beforTime) / 1000 > 1) {
					// System.out.println("相邻2条数据相差大于1秒，从【" +
					// los.getAllTimestamp() + "】开始！");
				} else if ((nowTime - beforTime) / 1000 == 0) {
					System.out.println("时间【重复】，从【" + los.getAllTimestamp() + "】开始!");
				} else {
					System.out.println("时间【错乱】，从【" + los.getAllTimestamp() + "】开始！");
				}
			} else {
				if (nowTime == s) {
					System.out.println("数据正确，从【" + sTime + "】到【" + eTime + "】，开始测试！");
				} else {
					System.out.println("第一条数据和开始时间对不上！");
				}
			}
			beforTime = nowTime;
		}
	}
}
